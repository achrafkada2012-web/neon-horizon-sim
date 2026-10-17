/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Car, WifiOff, RotateCcw, Volume2, ShieldCheck } from 'lucide-react';

interface TitleRevealOverlayProps {
  onReplay: () => void;
  onDrive: () => void;
}

export const TitleRevealOverlay: React.FC<TitleRevealOverlayProps> = ({
  onReplay,
  onDrive,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      {/* Background ambient radial glow */}
      <div className="absolute w-[600px] h-[300px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Offline Freedom Top Pill */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-tech text-xs tracking-wider uppercase mb-6 shadow-lg shadow-emerald-500/10">
        <WifiOff className="w-4 h-4 text-emerald-400" />
        <span>100% PLAYABLE OFFLINE · NO INTERNET CONNECTION REQUIRED</span>
      </div>

      {/* Main Title Lockup */}
      <div className="relative mb-4">
        <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-orange-500 uppercase drop-shadow-[0_10px_25px_rgba(0,240,255,0.35)]">
          NEON HORIZON
        </h1>
        <div className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-orange-400 tracking-widest uppercase mt-1">
          NYC OFF-GRID
        </div>
      </div>

      {/* Subtitles & Selling Point */}
      <p className="font-tech text-sm sm:text-base md:text-lg text-zinc-300 max-w-2xl font-semibold tracking-wide leading-relaxed mb-6">
        Next-gen photorealistic Manhattan racing combined with true mechanical cockpit simulation.
        Dominate the streets, the drift league, and tactical NYPD pursuits — anywhere, anytime, with zero server dependencies.
      </p>

      {/* Feature Badges */}
      <div className="flex flex-wrap justify-center gap-3 mb-8 max-w-xl">
        <div className="bg-zinc-900/90 border border-zinc-700/80 px-3 py-1.5 rounded text-xs font-tech text-zinc-200">
          ✓ 1:1 Laser-Scanned NYC
        </div>
        <div className="bg-zinc-900/90 border border-zinc-700/80 px-3 py-1.5 rounded text-xs font-tech text-zinc-200">
          ✓ Forza-Grade Handling & Physics
        </div>
        <div className="bg-zinc-900/90 border border-zinc-700/80 px-3 py-1.5 rounded text-xs font-tech text-zinc-200">
          ✓ Fully Interactive Cockpit & Mirrors
        </div>
        <div className="bg-zinc-900/90 border border-zinc-700/80 px-3 py-1.5 rounded text-xs font-tech text-cyan-300">
          ✓ 100% Offline Career & Garage
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onDrive}
          className="flex items-center gap-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-display font-black text-sm px-7 py-3 rounded-xl shadow-xl shadow-orange-500/30 transition transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Car className="w-5 h-5 fill-current" />
          <span>ENTER COCKPIT & DRIVE</span>
        </button>

        <button
          onClick={onReplay}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-tech font-bold text-sm px-6 py-3 rounded-xl transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>REPLAY TRAILER</span>
        </button>
      </div>
    </div>
  );
};
