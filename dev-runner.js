import { spawn } from 'child_process';
import path from 'path';

console.log('> Starting FilePizza with Python Flask backend + Vite frontend...');

// 1. Spawn Python Flask Backend on port 5000
const flask = spawn('python3', ['app.py'], {
  env: { ...process.env, FLASK_PORT: '5000' },
  stdio: 'inherit',
});

flask.on('error', (err) => {
  console.error('[Flask] Failed to start python process:', err);
});

flask.on('exit', (code, signal) => {
  if (code !== 0 && code !== null) {
    console.error(`[Flask] Exited with code ${code} / signal ${signal}`);
  }
});

// 2. Spawn Vite on port 3000
const vite = spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], {
  env: process.env,
  stdio: 'inherit',
});

vite.on('error', (err) => {
  console.error('[Vite] Failed to start vite process:', err);
});

// Clean shutdown handler
const shutdown = () => {
  console.log('> Shutting down FilePizza servers...');
  try {
    flask.kill('SIGTERM');
  } catch (e) {}
  try {
    vite.kill('SIGTERM');
  } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);
