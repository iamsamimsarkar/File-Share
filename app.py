import os
import time
import threading
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder="dist")
CORS(app)

# In-memory storage for rooms, WebRTC signaling messages, and ephemeral fallback relay chunks
class Room:
    def __init__(self, room_id, host_id, meta=None):
        self.room_id = room_id
        self.host_id = host_id
        self.created_at = time.time()
        self.meta = meta
        self.peers = {host_id}
        self.messages = []  # list of dicts: {sender_id, target_id, type, payload, timestamp}
        self.chunks = {}    # chunk_id -> {data, timestamp}

rooms = {}
rooms_lock = threading.Lock()

# Periodic background thread to clean up inactive rooms and stale relay chunks
def cleanup_stale_data():
    while True:
        time.sleep(60)
        now = time.time()
        with rooms_lock:
            to_delete = []
            for r_id, room in rooms.items():
                # Expire rooms older than 24h or empty rooms older than 30m
                if (now - room.created_at > 86400) or (len(room.peers) == 0 and now - room.created_at > 1800):
                    to_delete.append(r_id)
                else:
                    # Clean up old ephemeral chunks (> 60s)
                    expired_chunks = [c_id for c_id, c in room.chunks.items() if now - c['timestamp'] > 60]
                    for c_id in expired_chunks:
                        del room.chunks[c_id]
            for r_id in to_delete:
                del rooms[r_id]

cleanup_thread = threading.Thread(target=cleanup_stale_data, daemon=True)
cleanup_thread.start()

# --- API Endpoints ---

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "backend": "python-flask",
        "activeRooms": len(rooms),
        "timestamp": int(time.time() * 1000)
    })

@app.route("/api/rooms", methods=["POST"])
def create_room():
    data = request.get_json(force=True, silent=True) or {}
    room_id = data.get("roomId")
    host_id = data.get("hostId")
    meta = data.get("meta")

    if not room_id or not host_id:
        return jsonify({"error": "roomId and hostId are required"}), 400

    with rooms_lock:
        if room_id not in rooms:
            rooms[room_id] = Room(room_id, host_id, meta)
        else:
            room = rooms[room_id]
            room.peers.add(host_id)
            if meta:
                room.meta = meta

        room = rooms[room_id]
        return jsonify({
            "success": True,
            "roomId": room.room_id,
            "hostId": room.host_id,
            "meta": room.meta,
            "peerCount": len(room.peers)
        })

@app.route("/api/rooms/<room_id>", methods=["GET"])
def get_room(room_id):
    with rooms_lock:
        room = rooms.get(room_id)
        if not room:
            return jsonify({"error": "Pizza room not found or expired"}), 404

        return jsonify({
            "roomId": room.room_id,
            "hostId": room.host_id,
            "meta": room.meta,
            "peerCount": len(room.peers),
            "activePeers": list(room.peers)
        })

@app.route("/api/rooms/<room_id>/join", methods=["POST"])
def join_room(room_id):
    data = request.get_json(force=True, silent=True) or {}
    peer_id = data.get("peerId")

    with rooms_lock:
        room = rooms.get(room_id)
        if not room:
            return jsonify({"error": "Pizza room not found or expired"}), 404

        room.peers.add(peer_id)
        room.messages.append({
            "senderId": peer_id,
            "type": "join",
            "timestamp": int(time.time() * 1000)
        })

        return jsonify({
            "success": True,
            "meta": room.meta,
            "hostId": room.host_id,
            "peers": list(room.peers)
        })

@app.route("/api/rooms/<room_id>/signal", methods=["POST"])
def signal(room_id):
    data = request.get_json(force=True, silent=True) or {}
    sender_id = data.get("senderId")
    target_id = data.get("targetId")
    sig_type = data.get("type")
    payload = data.get("payload")

    with rooms_lock:
        room = rooms.get(room_id)
        if not room:
            return jsonify({"error": "Pizza room not found"}), 404

        signal_msg = {
            "senderId": sender_id,
            "targetId": target_id,
            "type": sig_type,
            "payload": payload,
            "timestamp": int(time.time() * 1000)
        }
        room.messages.append(signal_msg)

        # Cap message queue to last 200 messages
        if len(room.messages) > 200:
            room.messages = room.messages[-200:]

        return jsonify({"success": True})

@app.route("/api/rooms/<room_id>/signals", methods=["GET"])
def get_signals(room_id):
    peer_id = request.args.get("peerId")
    since = int(request.args.get("since", 0))

    with rooms_lock:
        room = rooms.get(room_id)
        if not room:
            return jsonify({"error": "Pizza room not found"}), 404

        relevant = [
            m for m in room.messages
            if m["timestamp"] > since
            and m["senderId"] != peer_id
            and (not m.get("targetId") or m.get("targetId") == peer_id)
        ]

        return jsonify({
            "signals": relevant,
            "peers": list(room.peers),
            "meta": room.meta
        })

@app.route("/api/rooms/<room_id>/relay/push", methods=["POST"])
def relay_push(room_id):
    data = request.get_json(force=True, silent=True) or {}
    chunk_id = data.get("chunkId")
    chunk_data = data.get("data")

    with rooms_lock:
        room = rooms.get(room_id)
        if not room:
            return jsonify({"error": "Room not found"}), 404

        room.chunks[chunk_id] = {
            "data": chunk_data,
            "timestamp": time.time()
        }
        return jsonify({"success": True})

@app.route("/api/rooms/<room_id>/relay/pull/<chunk_id>", methods=["GET"])
def relay_pull(room_id, chunk_id):
    with rooms_lock:
        room = rooms.get(room_id)
        if not room:
            return jsonify({"error": "Room not found"}), 404

        chunk = room.chunks.get(chunk_id)
        if not chunk:
            return jsonify({"error": "Chunk not ready"}), 404

        # Delete once pulled to keep memory ephemeral and light
        del room.chunks[chunk_id]
        return jsonify({
            "chunkId": chunk_id,
            "data": chunk["data"]
        })

# --- Production Static File Serving ---
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_static(path):
    dist_dir = os.path.join(os.path.dirname(__file__), "dist")
    if os.path.exists(dist_dir):
        if path and os.path.exists(os.path.join(dist_dir, path)):
            return send_from_directory(dist_dir, path)
        return send_from_directory(dist_dir, "index.html")
    return jsonify({"message": "FilePizza Python Flask API running. Frontend dev server is on port 3000."})

if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", os.environ.get("PORT", 5000)))
    print(f" * FilePizza Python Flask backend listening on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
