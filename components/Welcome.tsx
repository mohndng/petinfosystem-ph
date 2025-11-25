import React, { useState } from 'react';
import { Dog, ArrowRight, Loader2 } from 'lucide-react';

interface WelcomeProps {
  onGetStarted: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStart = () => {
    setIsProcessing(true);
    // Let the loader show for a bit before navigating
    setTimeout(() => {
        onGetStarted();
        // No need to set isProcessing to false, component unmounts
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-white">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-600 rounded-full blur-[150px] opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-600 rounded-full blur-[150px] opacity-30 animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="inline-flex items-center justify-center p-5 bg-white/10 backdrop-blur-md rounded-3xl mb-8 shadow-2xl border border-white/10">
          <Dog className="w-16 h-16 text-blue-300" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          Welcome to <span className="text-blue-400">PetInfoSys</span>
        </h1>
        <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-10">
          A unified platform for barangay animal registry, vaccination tracking, and public health monitoring to ensure safer communities for both people and pets.
        </p>
        <button
          onClick={handleStart}
          disabled={isProcessing}
          className="group relative inline-flex items-center justify-center px-8 py-4 bg-blue-600 rounded-2xl font-bold shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition-all text-lg disabled:bg-blue-400"
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <span>Get Started</span>
              <ArrowRight className="w-6 h-6 ml-3 transform transition-transform group-hover:translate-x-2" />
            </>
          )}
        </button>
      </div>

      <div className="absolute bottom-6 text-slate-500 text-xs font-medium z-10">
        PetInfoSys Solutions © 2025
      </div>
    </div>
  );
};