import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dropzone } from './components/Dropzone';
import { SenderView } from './components/SenderView';
import { ReceiverView } from './components/ReceiverView';
import { FeaturesGrid } from './components/FeaturesGrid';
import { HowItWorksModal } from './components/HowItWorksModal';
import { SecurityModal } from './components/SecurityModal';
import { RecipesModal } from './components/RecipesModal';
import { FAQModal } from './components/FAQModal';
import { generatePizzaRoomId } from './utils/pizzaNames';
import { generateEncryptionKey, exportKeyToBase64 } from './utils/crypto';
import { playSlicePop } from './utils/audio';

type AppMode = 'home' | 'sender' | 'receiver';

export default function App() {
  const [mode, setMode] = useState<AppMode>('home');
  const [roomId, setRoomId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [keyHash, setKeyHash] = useState<string>('');
  const [recipeId, setRecipeId] = useState<string>('pepperoni-classic');

  // Modals
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isRecipesOpen, setIsRecipesOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);

  // Check URL on load and hash change for receiver room
  useEffect(() => {
    const parseUrl = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const searchParams = new URLSearchParams(hash || window.location.search);
      const sliceParam = searchParams.get('slice');
      const keyParam = searchParams.get('key');

      if (sliceParam) {
        setRoomId(sliceParam);
        if (keyParam) setKeyHash(keyParam);
        setMode('receiver');
      } else {
        // If no slice in URL and not in sender mode, return to home
        if (mode === 'receiver') {
          setMode('home');
        }
      }
    };

    parseUrl();
    window.addEventListener('hashchange', parseUrl);
    return () => window.removeEventListener('hashchange', parseUrl);
  }, []);

  // Handler when user drops or selects a file to send
  const handleFileSelected = async (file: File, password?: string, chosenRecipeId?: string) => {
    const newRoomId = generatePizzaRoomId();
    setRoomId(newRoomId);
    setSelectedFile(file);
    if (chosenRecipeId) setRecipeId(chosenRecipeId);

    try {
      const key = await generateEncryptionKey();
      const base64Key = await exportKeyToBase64(key);
      setCryptoKey(key);
      setKeyHash(base64Key);
    } catch (e) {
      console.warn('CryptoKey generation skipped:', e);
    }

    setMode('sender');
  };

  const handleResetToHome = () => {
    playSlicePop();
    setMode('home');
    setSelectedFile(null);
    setCryptoKey(null);
    setKeyHash('');
    setRoomId('');
    if (window.location.hash) {
      history.pushState(null, '', window.location.pathname);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-amber-50/40 text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* Top Bar adhering to the Top Bar Contract */}
      <Header
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenRecipes={() => setIsRecipesOpen(true)}
        onOpenFAQ={() => setIsFAQOpen(true)}
        onGoHome={handleResetToHome}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center">
        {mode === 'home' && (
          <div className="w-full flex flex-col items-center">
            {/* Editorial Hero Title & Subtitle */}
            <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-stone-900">
                FilePizza 🍕
              </h1>
              <p className="text-sm md:text-base text-stone-600 font-medium">
                Free peer-to-peer file transfers in your browser.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-stone-500 pt-1">
                <span>Direct WebRTC stream</span>
                <span aria-hidden="true">·</span>
                <span>Zero server storage</span>
                <span aria-hidden="true">·</span>
                <span>Client-side AES-256</span>
              </div>
            </div>

            {/* Interactive Pizza Dropzone */}
            <Dropzone
              onFileSelected={handleFileSelected}
              selectedRecipeId={recipeId}
              onSelectRecipe={(id) => setRecipeId(id)}
            />

            {/* Why Transfer with FilePizza */}
            <FeaturesGrid />
          </div>
        )}

        {mode === 'sender' && selectedFile && (
          <SenderView
            roomId={roomId}
            file={selectedFile}
            cryptoKey={cryptoKey}
            keyHash={keyHash}
            recipeId={recipeId}
            onReset={handleResetToHome}
          />
        )}

        {mode === 'receiver' && (
          <ReceiverView
            roomId={roomId}
            keyHash={keyHash}
            onGoHome={handleResetToHome}
          />
        )}
      </main>

      {/* Clean quiet footer */}
      <Footer
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenFAQ={() => setIsFAQOpen(true)}
      />

      {/* Informational Modals */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      <SecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
      />

      <RecipesModal
        isOpen={isRecipesOpen}
        onClose={() => setIsRecipesOpen(false)}
        selectedRecipeId={recipeId}
        onSelectRecipe={(id) => setRecipeId(id)}
      />

      <FAQModal
        isOpen={isFAQOpen}
        onClose={() => setIsFAQOpen(false)}
      />
    </div>
  );
}
