import React, { useState, useRef } from 'react';
import { Upload, Lock, Sparkles, FileText, ChevronDown, Check } from 'lucide-react';
import { PizzaGraphic } from './PizzaGraphic';
import { PIZZA_RECIPES, PizzaRecipe } from '../utils/pizzaNames';
import { playSlicePop } from '../utils/audio';

interface DropzoneProps {
  onFileSelected: (file: File, password?: string, recipeId?: string) => void;
  selectedRecipeId: string;
  onSelectRecipe: (id: string) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelected,
  selectedRecipeId,
  onSelectRecipe,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [showRecipeDropdown, setShowRecipeDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeRecipe = PIZZA_RECIPES.find((r) => r.id === selectedRecipeId) || PIZZA_RECIPES[0];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      playSlicePop();
      onFileSelected(
        e.dataTransfer.files[0],
        isPasswordProtected && password ? password : undefined,
        selectedRecipeId
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      playSlicePop();
      onFileSelected(
        e.target.files[0],
        isPasswordProtected && password ? password : undefined,
        selectedRecipeId
      );
    }
  };

  const handleSampleFile = (type: 'receipt' | 'cookbook') => {
    playSlicePop();
    let content = '';
    let name = '';
    let mimeType = 'text/plain';

    if (type === 'receipt') {
      name = 'filepizza_order_receipt.txt';
      content = `===================================================
FILEPIZZA ORDER RECEIPT
Timestamp: ${new Date().toISOString()}
Oven: Wood-fired 485°F
Slice: P2P WebRTC Direct DataChannel
Security: Zero-knowledge client-side AES-256
Freshness: Hot & Fresh out of the oven!
Thank you for using FilePizza!
===================================================`;
    } else {
      name = 'artisan_pizza_manifesto.md';
      content = `# The FilePizza Manifesto 🍕

1. True Peer-to-Peer: Your bytes travel directly between browsers.
2. No Cloud Storage: Nothing is kept on middleman servers.
3. Cryptographic Privacy: Keys stay in the URL fragment.
4. Delicious Simplicity: Drag, drop, share, grab a slice!
`;
    }

    const blob = new Blob([content], { type: mimeType });
    const file = new File([blob], name, { type: mimeType });
    onFileSelected(
      file,
      isPasswordProtected && password ? password : undefined,
      selectedRecipeId
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Recipe Selection Bar */}
      <div className="w-full mb-6 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRecipeDropdown(!showRecipeDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-900/10 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:border-amber-500/50 transition-colors shadow-xs"
          >
            <span>Recipe:</span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              {activeRecipe.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {showRecipeDropdown && (
            <div className="absolute left-0 mt-1 w-64 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl z-30 p-1.5 space-y-1">
              {PIZZA_RECIPES.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => {
                    onSelectRecipe(recipe.id);
                    setShowRecipeDropdown(false);
                    playSlicePop();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    recipe.id === selectedRecipeId
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-medium'
                      : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{recipe.name}</p>
                    <p className="text-[11px] text-stone-500 truncate max-w-[190px]">
                      {recipe.description}
                    </p>
                  </div>
                  {recipe.id === selectedRecipeId && (
                    <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Security Password Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsPasswordProtected(!isPasswordProtected);
              playSlicePop();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors shadow-xs ${
              isPasswordProtected
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-medium'
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-stone-300'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isPasswordProtected ? 'Password Enabled' : 'Add Password'}</span>
          </button>
        </div>
      </div>

      {/* Password Input Box if enabled */}
      {isPasswordProtected && (
        <div className="w-full mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Pizza Delivery Passcode (Optional Extra AES-256 Layer)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter passphrase to lock slices..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
          <p className="mt-1 text-[11px] text-stone-500">
            The receiver must enter this password to decrypt and slice the file.
          </p>
        </div>
      )}

      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full relative group cursor-pointer rounded-3xl border-2 border-dashed p-8 md:p-12 flex flex-col items-center justify-center text-center transition-all duration-300 bg-white/70 dark:bg-stone-900/70 backdrop-blur-xs shadow-lg ${
          isDragOver
            ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 scale-[1.01] shadow-amber-500/10'
            : 'border-stone-300 dark:border-stone-700 hover:border-amber-500/70 hover:shadow-xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Big Interactive Pizza */}
        <div className="mb-6 pointer-events-none">
          <PizzaGraphic
            percentage={0}
            recipeId={selectedRecipeId}
            size={280}
            interactive={false}
          />
        </div>

        {/* Main CTA Text */}
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center justify-center gap-2">
            <Upload className="w-6 h-6 text-amber-600 dark:text-amber-400 group-hover:-translate-y-1 transition-transform" />
            <span>Drop a file to send</span>
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            or <span className="font-semibold text-amber-600 dark:text-amber-400 underline underline-offset-2">select a file</span> from your computer
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-500 pt-1">
            Free, direct peer-to-peer file transfers. No file size limits.
          </p>
        </div>
      </div>

      {/* Quick Test / Sample file row */}
      <div className="w-full mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-stone-500">
        <span>Need a test file?</span>
        <button
          type="button"
          onClick={() => handleSampleFile('receipt')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-amber-600 hover:border-amber-400 transition-colors shadow-2xs"
        >
          <FileText className="w-3.5 h-3.5 text-amber-600" />
          <span>Pizza Receipt (.txt)</span>
        </button>
        <button
          type="button"
          onClick={() => handleSampleFile('cookbook')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-amber-600 hover:border-amber-400 transition-colors shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Pizza Manifesto (.md)</span>
        </button>
      </div>
    </div>
  );
};
