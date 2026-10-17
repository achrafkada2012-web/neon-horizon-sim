/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Mic, MicOff, Film, Car, Sparkles, WifiOff } from 'lucide-react';
import { TRAILER_SCRIPT, ScriptCue, TrailerAct } from '../data/trailerScript.ts';

interface TrailerPlayerHUDProps {
  isPlaying: boolean;
  currentTime: number;
  currentAct: TrailerAct;
  currentCue: ScriptCue;
  voiceoverEnabled: boolean;
  muted: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onRestart: () => void;
  onToggleVoiceover: () => void;
  onToggleMute: () => void;
  onSwitchToDriveMode: () => void;
}

export const TrailerPlayerHUD: React.FC<TrailerPlayerHUDProps> = ({
  isPlaying,
  currentTime,
  currentAct,
  currentCue,
  voiceoverEnabled,
  muted,
  onTogglePlay,
  onSeek,
  onRestart,
  onToggleVoiceover,
  onToggleMute,
  onSwitchToDriveMode,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  const progressPercent = (currentTime / 60) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* Top Bar: Cinematic Badge & Mode Switch */}
      <div className="flex items-center justify-between w-full z-20">
        <div className="flex items-center gap-3">
          <div className="bg-black/80 border border-cyan-500/40 px-3 py-1.5 rounded flex items-center gap-2">
            <Film className="w-4 h-4 text-cyan-400" />
            <span className="font-display font-bold text-xs tracking-wider text-white uppercase">
              Promo Trailer Director's Cut
            </span>
          </div>

          <div className="bg-black/80 border border-white/20 px-3 py-1.5 rounded flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-tech">ACT {currentAct.actNumber}/4:</span>
            <span className="font-tech font-bold text-xs text-orange-400 tracking-wider">
              {currentAct.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Offline Pillar Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded text-emerald-300 text-xs font-tech">
            <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% OFFLINE ARCHITECTURE</span>
          </div>

          <button
            onClick={onSwitchToDriveMode}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black font-display font-bold text-xs px-4 py-2 rounded shadow-lg shadow-orange-500/25 transition cursor-pointer"
          >
            <Car className="w-4 h-4" />
            <span>TAKE THE WHEEL</span>
          </button>
        </div>
      </div>

      {/* Middle Center: Dynamic Disconnected Wi-Fi Notification during Act 3 */}
      {currentTime >= 44 && currentTime <= 50 && (
        <div className="self-center my-auto bg-black/90 border-2 border-cyan-400 p-6 rounded-xl shadow-2xl shadow-cyan-500/30 text-center max-w-lg pointer-events-none animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-cyan-950/90 border border-cyan-400 flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-cyan-300" />
            </div>
          </div>
          <div className="font-display font-black text-xl text-white tracking-widest mb-1">
            WI-FI DISCONNECTED: UNTETHERED FREEDOM
          </div>
          <p className="font-tech text-cyan-300 text-sm tracking-wide">
            100% OFFLINE CAPABLE • ZERO SERVERS • FORZA-GRADE REALISM ANYWHERE
          </p>
        </div>
      )}

      {/* Subtitles & Script Scene Tag Overlay (21:9 Theater Style) */}
      <div className="self-center w-full max-w-4xl text-center mb-3 z-10">
        <div className="bg-black/85 border border-zinc-800 rounded-lg p-4 shadow-2xl backdrop-blur-none">
          <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2 mb-2 font-tech">
            <span className="text-cyan-400 font-bold tracking-wider">{currentCue.heading}</span>
            <span className="text-zinc-400">{currentCue.location}</span>
          </div>

          {/* Voiceover line */}
          <div className="text-white font-sans font-semibold text-sm md:text-base tracking-wide leading-relaxed drop-shadow mb-2">
            <span className="text-amber-400 font-bold mr-1.5">[VOICEOVER]:</span>
            "{currentCue.voiceover}"
          </div>

          {/* Visual & Audio summary tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left text-xs font-tech text-zinc-300 pt-1 border-t border-zinc-800/60">
            <div>
              <span className="text-cyan-400 font-semibold mr-1">[VISUAL]:</span>
              <span className="text-zinc-300 line-clamp-2">{currentCue.visual}</span>
            </div>
            <div>
              <span className="text-rose-400 font-semibold mr-1">[AUDIO]:</span>
              <span className="text-zinc-300 line-clamp-2">{currentCue.audio}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Control Dock (Timeline, Acts, Transport) */}
      <div className="w-full max-w-4xl mx-auto bg-zinc-950/90 border border-zinc-800 rounded-xl p-3 md:p-4 pointer-events-auto shadow-2xl">
        {/* Act Navigation Chips */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {TRAILER_SCRIPT.map((act) => {
            const isActive = currentAct.actNumber === act.actNumber;
            const actStart = act.cues[0]?.timeStart || 0;
            return (
              <button
                key={act.actNumber}
                onClick={() => onSeek(actStart)}
                className={`text-left p-1.5 md:p-2 rounded border transition text-xs cursor-pointer ${
                  isActive
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-tech text-[10px] text-zinc-400">ACT {act.actNumber} ({act.timeRange})</div>
                <div className="font-display font-semibold text-[11px] truncate">{act.title}</div>
              </button>
            );
          })}
        </div>

        {/* Timeline Scrubber */}
        <div className="relative mb-3 flex items-center gap-3">
          <span className="font-tech text-xs tabular-nums text-zinc-400 min-w-12">
            {formatTime(currentTime)}
          </span>
          <div
            className="flex-1 h-3 bg-zinc-900 border border-zinc-700 rounded-full cursor-pointer relative overflow-hidden group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              onSeek(ratio * 60);
            }}
          >
            {/* Act Markers */}
            <div className="absolute left-[25%] top-0 bottom-0 w-0.5 bg-zinc-600 z-10" title="Act 2 Start" />
            <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-zinc-600 z-10" title="Act 3 Start" />
            <div className="absolute left-[83.3%] top-0 bottom-0 w-0.5 bg-zinc-600 z-10" title="Act 4 Start" />

            {/* Progress Fill */}
            <div
              className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-cyan-400 transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-tech text-xs tabular-nums text-zinc-400 min-w-12 text-right">
            1:00.0
          </span>
        </div>

        {/* Playback Controls & Toggles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-lg bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center transition shadow cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={onRestart}
              className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition cursor-pointer"
              title="Restart Trailer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Voiceover Speech synthesis toggle */}
            <button
              onClick={onToggleVoiceover}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-tech transition cursor-pointer ${
                voiceoverEnabled
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
              }`}
              title="Narrate Voiceover with Voice Synthesis"
            >
              {voiceoverEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              <span>{voiceoverEnabled ? 'VOICEOVER: ON' : 'VOICEOVER: OFF'}</span>
            </button>

            {/* Mute Audio */}
            <button
              onClick={onToggleMute}
              className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition cursor-pointer"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
