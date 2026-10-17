/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Gauge,
  Power,
  ChevronDown,
  ChevronUp,
  Camera,
  CloudRain,
  Sun,
  Snowflake,
  Wind,
  WifiOff,
  Film,
  Zap,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { VehicleTelemetry, CameraViewMode, WeatherMode } from '../three/NYCScene.ts';

interface CockpitDashboardHUDProps {
  telemetry: VehicleTelemetry;
  cameraMode: CameraViewMode;
  weather: WeatherMode;
  onToggleStartStop: () => void;
  onToggleLaunchControl: () => void;
  onToggleTCS: () => void;
  onShiftGear: (direction: 1 | -1) => void;
  onPullHandbrake: (active: boolean) => void;
  onSelectCamera: (mode: CameraViewMode) => void;
  onSelectWeather: (weather: WeatherMode) => void;
  onSwitchToTrailerMode: () => void;
}

export const CockpitDashboardHUD: React.FC<CockpitDashboardHUDProps> = ({
  telemetry,
  cameraMode,
  weather,
  onToggleStartStop,
  onToggleLaunchControl,
  onToggleTCS,
  onShiftGear,
  onPullHandbrake,
  onSelectCamera,
  onSelectWeather,
  onSwitchToTrailerMode,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  const gearDisplay = telemetry.gear === -1 ? 'R' : telemetry.gear === 0 ? 'N' : `${telemetry.gear}`;
  const rpmPercent = Math.min(100, (telemetry.rpm / 9200) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* Top Header: Automotive Brand Lockup & Offline Status */}
      <div className="flex items-center justify-between w-full z-20">
        <div className="flex items-center gap-3">
          <div className="bg-black/85 border border-orange-500/50 px-3.5 py-1.5 rounded flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="font-display font-black text-sm tracking-wider text-white">
              NEON HORIZON
            </span>
            <span className="font-tech text-xs text-orange-400 font-bold">NYC OFF-GRID</span>
          </div>

          {/* 100% Offline Status Badge */}
          <div className="bg-black/85 border border-emerald-500/50 px-3 py-1.5 rounded flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-tech text-xs text-emerald-400 font-semibold tracking-wide">
              OFFLINE CORE ACTIVE • 0ms PING
            </span>
          </div>
        </div>

        {/* Mode Switch Back to Trailer */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onSwitchToTrailerMode}
            className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-tech font-bold text-xs px-4 py-2 rounded transition cursor-pointer"
          >
            <Film className="w-4 h-4 text-cyan-400" />
            <span>DIRECTOR'S TRAILER</span>
          </button>
        </div>
      </div>

      {/* Top-Right Perimeter: Live Digital Instrument Telemetry (Low Occlusion) */}
      <div className="absolute top-20 right-4 md:right-6 pointer-events-none flex flex-col items-end gap-2 z-10">
        <div className="bg-black/85 border border-zinc-800 rounded-lg p-3 text-right min-w-44">
          <div className="text-[10px] font-tech text-zinc-400 uppercase tracking-widest">DIGITAL VELOCITY</div>
          <div className="font-display font-black text-4xl text-white tabular-nums tracking-tighter leading-none mt-1">
            {Math.round(telemetry.speedMph)}
            <span className="text-xs font-tech font-normal text-cyan-400 ml-1.5">MPH</span>
          </div>

          {/* Tachometer RPM Bar */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] font-tech text-zinc-400 tabular-nums mb-1">
              <span>{Math.round(telemetry.rpm)} RPM</span>
              <span className="text-rose-400 font-bold">9,200 MAX</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-700">
              <div
                className={`h-full transition-all duration-75 ${
                  rpmPercent > 85 ? 'bg-rose-500' : rpmPercent > 65 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${rpmPercent}%` }}
              />
            </div>
          </div>

          {/* Telemetry Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-zinc-800 text-left font-tech text-xs">
            <div>
              <span className="text-zinc-500 text-[10px]">GEAR:</span>
              <div className="font-display font-bold text-lg text-amber-400">{gearDisplay}</div>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px]">BOOST:</span>
              <div className="font-display font-bold text-lg text-cyan-300 tabular-nums">
                {telemetry.boostPsi.toFixed(1)} <span className="text-[10px] text-zinc-400">PSI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Quick Hint */}
        <div className="bg-black/75 border border-zinc-800/80 px-2.5 py-1.5 rounded text-[11px] font-tech text-zinc-400">
          <span className="text-white font-semibold">WASD / Arrows</span> Drive · <span className="text-white font-semibold">Space</span> Handbrake · <span className="text-white font-semibold">Q/E</span> Shift · <span className="text-white font-semibold">C</span> Cam
        </div>
      </div>

      {/* COLLAPSIBLE UNIFIED BOTTOM CONTROL DOCK (Three.js Skill Compliant) */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center pointer-events-auto z-20">
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="mb-1 bg-black/90 border border-zinc-800 hover:border-zinc-600 px-4 py-1 rounded-t-lg text-zinc-400 hover:text-white font-tech text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg"
        >
          {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isDockCollapsed ? 'SHOW COCKPIT CONTROLS (H)' : 'MINIMIZE DOCK (H)'}</span>
        </button>

        {/* Dock Content */}
        {!isDockCollapsed && (
          <div className="w-full bg-zinc-950/95 border border-zinc-800 rounded-xl p-3 md:p-4 shadow-2xl backdrop-blur-none transition-all">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {/* 1. Engine Start / Stop */}
              <button
                onClick={onToggleStartStop}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition cursor-pointer ${
                  telemetry.isEngineRunning
                    ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-600 text-rose-300'
                }`}
              >
                <Power className="w-5 h-5 mb-1" />
                <span className="font-display font-bold text-xs">
                  {telemetry.isEngineRunning ? 'ENGINE ON' : 'START / STOP'}
                </span>
                <span className="font-tech text-[10px] text-zinc-400">Tactile V12 Ignition</span>
              </button>

              {/* 2. Launch Control */}
              <button
                onClick={onToggleLaunchControl}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition cursor-pointer ${
                  telemetry.launchControlArmed
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-amber-500/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Zap className="w-5 h-5 mb-1" />
                <span className="font-display font-bold text-xs">LAUNCH CTRL</span>
                <span className="font-tech text-[10px]">
                  {telemetry.launchControlArmed ? 'ARMED (5,500 RPM)' : 'STANDBY (L)'}
                </span>
              </button>

              {/* 3. Traction Control (TCS / ESC) */}
              <button
                onClick={onToggleTCS}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition cursor-pointer ${
                  telemetry.tcsMode === 'OFF'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                    : telemetry.tcsMode === 'SPORT'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-cyan-400 hover:border-zinc-700'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5 mb-1" />
                <span className="font-display font-bold text-xs">TCS: {telemetry.tcsMode}</span>
                <span className="font-tech text-[10px] text-zinc-400">Toggle ESC (T)</span>
              </button>

              {/* 4. Manual Paddle Shifter */}
              <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] font-tech text-zinc-400">
                  <span>PADDLE SHIFT</span>
                  <span className="text-amber-400 font-bold">GEAR {gearDisplay}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    onClick={() => onShiftGear(-1)}
                    className="flex-1 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-tech font-bold text-xs cursor-pointer"
                    title="Downshift (Q)"
                  >
                    - Q
                  </button>
                  <button
                    onClick={() => onShiftGear(1)}
                    className="flex-1 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-tech font-bold text-xs cursor-pointer"
                    title="Upshift (E)"
                  >
                    + E
                  </button>
                </div>
              </div>

              {/* 5. Camera Angle Switcher */}
              <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex flex-col justify-between">
                <div className="text-[10px] font-tech text-zinc-400 flex items-center justify-between">
                  <span>CAMERA (C)</span>
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <select
                  value={cameraMode}
                  onChange={(e) => onSelectCamera(e.target.value as CameraViewMode)}
                  className="bg-zinc-950 text-white font-tech text-xs rounded p-1 border border-zinc-700 mt-1 cursor-pointer focus:outline-none"
                >
                  <option value="cockpit">Cockpit View</option>
                  <option value="chase">Chase Camera</option>
                  <option value="hood">Hood Angle</option>
                  <option value="cinematic">Orbit Showcase</option>
                </select>
              </div>

              {/* 6. Dynamic NYC Weather Switcher */}
              <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex flex-col justify-between">
                <div className="text-[10px] font-tech text-zinc-400 flex items-center justify-between">
                  <span>WEATHER</span>
                  <CloudRain className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <select
                  value={weather}
                  onChange={(e) => onSelectWeather(e.target.value as WeatherMode)}
                  className="bg-zinc-950 text-white font-tech text-xs rounded p-1 border border-zinc-700 mt-1 cursor-pointer focus:outline-none"
                >
                  <option value="neon_rain">Times Sq (Rain)</option>
                  <option value="central_park_wet">Central Park (Wet)</option>
                  <option value="brooklyn_sunset">Brooklyn (Sunset)</option>
                  <option value="manhattan_blizzard">Blizzard (Snow)</option>
                </select>
              </div>
            </div>

            {/* Handbrake bar & Drift indicator */}
            <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-tech">
              <div className="flex items-center gap-2">
                <button
                  onMouseDown={() => onPullHandbrake(true)}
                  onMouseUp={() => onPullHandbrake(false)}
                  onTouchStart={() => onPullHandbrake(true)}
                  onTouchEnd={() => onPullHandbrake(false)}
                  className={`px-3 py-1 rounded font-bold cursor-pointer transition ${
                    telemetry.handbrakeActive
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  HOLD HANDBRAKE (SPACE)
                </button>
                {telemetry.isDrifting && (
                  <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded font-display font-bold text-[10px]">
                    DRIFT SLIP-ANGLE ACTIVE
                  </span>
                )}
              </div>

              <div className="text-zinc-500 text-[11px] hidden md:block">
                Forza Horizon Physical Kinematics • 100% Offline Single-Player Career Engine
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
