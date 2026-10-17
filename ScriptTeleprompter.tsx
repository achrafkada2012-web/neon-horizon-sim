/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Play,
  Share2,
  MapPin,
  Sparkles,
  Gauge,
  Flame,
  WifiOff,
  Volume2,
  ChevronRight,
  Download
} from 'lucide-react';
import { TRAILER_SCRIPT, GAME_CORE_FEATURES, TrailerAct } from '../data/trailerScript.ts';

interface ScriptTeleprompterProps {
  onJumpToAct: (actNumber: number, timeStart: number) => void;
  onClose: () => void;
}

export const ScriptTeleprompter: React.FC<ScriptTeleprompterProps> = ({
  onJumpToAct,
  onClose,
}) => {
  const [selectedTab, setSelectedTab] = useState<'script' | 'features'>('script');
  const [activeActFilter, setActiveActFilter] = useState<number | 'all'>('all');
  const [copied, setCopied] = useState(false);

  // Generate full plain text screenplay for copying
  const generateFullScriptText = () => {
    let output = `# NEON HORIZON: NYC OFF-GRID\n`;
    output += `## OFFICIAL NEXT-GEN PROMOTIONAL TRAILER SCRIPT (0:00 - 1:00)\n`;
    output += `Target Rating: Uncompromised Forza-Grade Motorsport Realism • 100% Offline Architecture\n\n`;

    TRAILER_SCRIPT.forEach((act) => {
      output += `================================================================================\n`;
      output += `ACT ${act.actNumber}: ${act.title} (${act.timeRange})\n`;
      output += `Core Theme: ${act.coreTheme}\n`;
      output += `================================================================================\n\n`;

      act.cues.forEach((cue) => {
        output += `SCENE: ${cue.heading} [${cue.timecode}]\n`;
        output += `Location: ${cue.location}\n`;
        output += `[Visual]: ${cue.visual}\n`;
        output += `[Audio]: ${cue.audio}\n`;
        output += `[Voiceover]: "${cue.voiceover}"\n`;
        if (cue.cockpitAction) {
          output += `[Cockpit Control Action]: ${cue.cockpitAction}\n`;
        }
        output += `\n`;
      });
    });

    output += `\n================================================================================\n`;
    output += `GAME CORE FEATURES SPECIFICATION\n`;
    output += `================================================================================\n`;
    GAME_CORE_FEATURES.forEach((f, idx) => {
      output += `${idx + 1}. ${f.title} (${f.category})\n`;
      output += `   - Highlight: ${f.highlight}\n`;
      output += `   - Details: ${f.description}\n\n`;
    });

    return output;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateFullScriptText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const displayedActs = activeActFilter === 'all'
    ? TRAILER_SCRIPT
    : TRAILER_SCRIPT.filter(a => a.actNumber === activeActFilter);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 md:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg md:text-xl text-white tracking-wide">
                Trailer Script & Director's Production Bible
              </h2>
              <p className="font-tech text-xs text-zinc-400">
                Verbatim 4-Act Promotional Screenplay · Forza Horizon Physics · 100% Offline NYC Open-World
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-tech transition cursor-pointer border border-zinc-700"
              title="Copy Complete Screenplay"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY SCRIPT'}</span>
            </button>
            <button
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Switcher & Act Filter */}
        <div className="px-4 py-3 bg-zinc-900/30 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTab('script')}
              className={`px-3 py-1.5 rounded-lg font-tech text-xs font-bold transition cursor-pointer ${
                selectedTab === 'script'
                  ? 'bg-orange-500 text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              4-ACT TRAILER SCRIPT
            </button>
            <button
              onClick={() => setSelectedTab('features')}
              className={`px-3 py-1.5 rounded-lg font-tech text-xs font-bold transition cursor-pointer ${
                selectedTab === 'features'
                  ? 'bg-orange-500 text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              6 CORE GAME FEATURES
            </button>
          </div>

          {selectedTab === 'script' && (
            <div className="flex items-center gap-1.5 font-tech text-xs">
              <span className="text-zinc-500 mr-1">FILTER:</span>
              <button
                onClick={() => setActiveActFilter('all')}
                className={`px-2 py-1 rounded cursor-pointer ${
                  activeActFilter === 'all' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ALL ACTS
              </button>
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setActiveActFilter(num)}
                  className={`px-2 py-1 rounded cursor-pointer ${
                    activeActFilter === num ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  ACT {num}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {selectedTab === 'script' ? (
            displayedActs.map((act) => (
              <div key={act.actNumber} className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
                {/* Act Header */}
                <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-sm text-orange-400 tracking-wider">
                        ACT {act.actNumber}
                      </span>
                      <span className="text-xs font-tech text-zinc-400">({act.timeRange})</span>
                    </div>
                    <h3 className="font-display font-bold text-base md:text-lg text-white mt-0.5">
                      {act.title}
                    </h3>
                    <p className="font-tech text-xs text-zinc-400 mt-1 italic">
                      Theme: {act.coreTheme}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onJumpToAct(act.actNumber, act.cues[0]?.timeStart || 0);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-black font-tech font-bold text-xs px-3 py-2 rounded-lg transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>PLAY SCENE</span>
                  </button>
                </div>

                {/* Cues List */}
                <div className="p-4 space-y-5">
                  {act.cues.map((cue) => (
                    <div key={cue.id} className="border-l-2 border-orange-500/70 pl-4 py-1">
                      {/* Heading & Timecode */}
                      <div className="flex items-center justify-between text-xs font-tech mb-2">
                        <span className="font-bold text-cyan-400 tracking-wide uppercase">
                          {cue.heading}
                        </span>
                        <span className="text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded font-mono">
                          {cue.timecode}
                        </span>
                      </div>

                      <div className="text-xs font-tech text-zinc-400 mb-2">
                        <span className="text-zinc-500">SETTING:</span> {cue.location}
                      </div>

                      {/* [Visual] */}
                      <div className="mb-2 text-xs md:text-sm font-sans text-zinc-200 leading-relaxed">
                        <span className="font-tech font-bold text-cyan-400 mr-1.5">[Visual]:</span>
                        {cue.visual}
                      </div>

                      {/* [Audio] */}
                      <div className="mb-2 text-xs md:text-sm font-sans text-zinc-300 leading-relaxed">
                        <span className="font-tech font-bold text-rose-400 mr-1.5">[Audio]:</span>
                        {cue.audio}
                      </div>

                      {/* [Voiceover] */}
                      <div className="p-3 bg-black/60 border border-zinc-800 rounded-lg text-white font-sans text-sm md:text-base font-medium leading-relaxed mb-2">
                        <span className="font-tech font-bold text-amber-400 mr-2">[Voiceover]:</span>
                        "{cue.voiceover}"
                      </div>

                      {/* Cockpit Action */}
                      {cue.cockpitAction && (
                        <div className="text-xs font-tech text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 px-2.5 py-1.5 rounded">
                          <span className="font-bold text-emerald-300">Cockpit Physical Mechanics: </span>
                          {cue.cockpitAction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            /* 6 CORE GAME FEATURES BREAKDOWN */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GAME_CORE_FEATURES.map((feature, idx) => (
                <div
                  key={feature.title}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
                      {idx === 0 && <MapPin className="w-5 h-5" />}
                      {idx === 1 && <Sparkles className="w-5 h-5" />}
                      {idx === 2 && <Gauge className="w-5 h-5" />}
                      {idx === 3 && <Flame className="w-5 h-5" />}
                      {idx === 4 && <WifiOff className="w-5 h-5" />}
                      {idx === 5 && <Volume2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-[10px] font-tech text-orange-400 uppercase tracking-widest">
                        PILLAR 0{idx + 1} · {feature.category}
                      </div>
                      <h4 className="font-display font-bold text-base text-white">
                        {feature.title}
                      </h4>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-zinc-800/80 px-3 py-1.5 rounded font-tech text-xs text-cyan-300 mb-2">
                    {feature.highlight}
                  </div>

                  <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 md:p-4 border-t border-zinc-800 bg-zinc-900/70 flex items-center justify-between font-tech text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Ready for voice actors, audio directors & cinematic capture</span>
          </div>
          <div>Total Runtime: 60 Seconds (1:00.0)</div>
        </div>
      </div>
    </div>
  );
};
