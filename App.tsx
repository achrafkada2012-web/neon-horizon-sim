/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NYCScene, CameraViewMode, WeatherMode, VehicleTelemetry } from './three/NYCScene.ts';
import { soundEngine } from './audio/soundEngine.ts';
import { TRAILER_SCRIPT, TrailerAct, ScriptCue } from './data/trailerScript.ts';
import { TrailerPlayerHUD } from './components/TrailerPlayerHUD.tsx';
import { CockpitDashboardHUD } from './components/CockpitDashboardHUD.tsx';
import { ScriptTeleprompter } from './components/ScriptTeleprompter.tsx';
import { TitleRevealOverlay } from './components/TitleRevealOverlay.tsx';
import { FileText, Maximize, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<NYCScene | null>(null);

  // Experience Mode
  const [appMode, setAppMode] = useState<'trailer' | 'drive'>('trailer');

  // Trailer Timeline State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [voiceoverEnabled, setVoiceoverEnabled] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(false);
  const [showScriptModal, setShowScriptModal] = useState<boolean>(false);

  // Cockpit Drive State
  const [telemetry, setTelemetry] = useState<VehicleTelemetry>({
    speedMph: 0,
    rpm: 850,
    gear: 1,
    isEngineRunning: true,
    launchControlArmed: false,
    tcsMode: 'ON',
    boostPsi: 0,
    steeringAngle: 0,
    isDrifting: false,
    isBraking: false,
    handbrakeActive: false,
    offlineStatus: true
  });
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('cockpit');
  const [weather, setWeather] = useState<WeatherMode>('neon_rain');

  // Active Trailer Act & Cue
  const currentAct: TrailerAct = TRAILER_SCRIPT.find(
    (act) => {
      const actStart = act.cues[0]?.timeStart || 0;
      const actEnd = act.cues[act.cues.length - 1]?.timeEnd || 60;
      return currentTime >= actStart && currentTime < actEnd;
    }
  ) || TRAILER_SCRIPT[0];

  const currentCue: ScriptCue = currentAct.cues.find(
    (c) => currentTime >= c.timeStart && currentTime < c.timeEnd
  ) || currentAct.cues[0];

  const lastSpokenCueIdRef = useRef<string>('');

  // 1. Initialize Three.js Scene
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const scene = new NYCScene(canvasMountRef.current);
    sceneRef.current = scene;

    scene.onTelemetryUpdate = (telem) => {
      setTelemetry(telem);
    };

    const handleResize = () => {
      scene.handleResize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // 2. Trailer Timeline Animation Loop
  useEffect(() => {
    let animId: number;
    let lastTimestamp: number = performance.now();

    const loop = (timestamp: number) => {
      if (appMode === 'trailer' && isPlaying) {
        const dt = (timestamp - lastTimestamp) / 1000;
        setCurrentTime((prev) => {
          const next = prev + dt;
          if (next >= 60) {
            setIsPlaying(false);
            return 60;
          }
          return next;
        });
      }
      lastTimestamp = timestamp;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [appMode, isPlaying]);

  // 3. Sync Scene with Current Cue during Trailer Mode
  useEffect(() => {
    if (!sceneRef.current) return;

    if (appMode === 'trailer') {
      sceneRef.current.setCinematicState(
        isPlaying,
        currentTime,
        currentCue.cameraPreset,
        currentCue.environmentPreset
      );

      // Trigger SFX at specific timeline moments
      if (currentTime >= 50 && currentTime < 51) {
        soundEngine.playBarricadeSmash();
      } else if (currentTime >= 55 && currentTime < 56) {
        soundEngine.playCinematicBraam();
      }

      // Voiceover speech synthesis
      if (voiceoverEnabled && isPlaying && lastSpokenCueIdRef.current !== currentCue.id) {
        lastSpokenCueIdRef.current = currentCue.id;
        soundEngine.speakNarration(currentCue.voiceover);
      }
    } else {
      sceneRef.current.setCinematicState(false, 0, 'cockpit', weather);
      soundEngine.stopNarration();
    }
  }, [currentTime, currentCue, appMode, isPlaying, voiceoverEnabled, weather]);

  // 4. Keyboard Controls for Free Drive Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showScriptModal) return;

      const scene = sceneRef.current;
      if (!scene) return;

      // Global hotkeys
      if (e.code === 'KeyM') {
        setMuted((m) => {
          soundEngine.setMuted(!m);
          return !m;
        });
      }

      if (appMode === 'drive') {
        switch (e.code) {
          case 'KeyW':
          case 'ArrowUp':
            scene.inputs.throttle = 1.0;
            break;
          case 'KeyS':
          case 'ArrowDown':
            scene.inputs.brake = 1.0;
            break;
          case 'KeyA':
          case 'ArrowLeft':
            scene.inputs.steer = -1.0;
            break;
          case 'KeyD':
          case 'ArrowRight':
            scene.inputs.steer = 1.0;
            break;
          case 'Space':
            scene.inputs.handbrake = true;
            scene.pullHandbrake(true);
            break;
          case 'KeyE':
            scene.shiftGear(1);
            break;
          case 'KeyQ':
            scene.shiftGear(-1);
            break;
          case 'KeyL':
            scene.toggleLaunchControl();
            break;
          case 'KeyT':
            scene.toggleTCS();
            break;
          case 'KeyC':
            setCameraMode((prev) => {
              const modes: CameraViewMode[] = ['cockpit', 'chase', 'hood', 'cinematic'];
              const nextIndex = (modes.indexOf(prev) + 1) % modes.length;
              const nextMode = modes[nextIndex];
              scene.cameraMode = nextMode;
              return nextMode;
            });
            break;
        }
      } else {
        // Trailer mode space to play/pause
        if (e.code === 'Space') {
          setIsPlaying((p) => !p);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const scene = sceneRef.current;
      if (!scene || appMode !== 'drive') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          scene.inputs.throttle = 0;
          break;
        case 'KeyS':
        case 'ArrowDown':
          scene.inputs.brake = 0;
          break;
        case 'KeyA':
        case 'ArrowLeft':
        case 'KeyD':
        case 'ArrowRight':
          scene.inputs.steer = 0;
          break;
        case 'Space':
          scene.inputs.handbrake = false;
          scene.pullHandbrake(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [appMode, showScriptModal]);

  // Handlers
  const handleSeek = (secs: number) => {
    setCurrentTime(secs);
    soundEngine.stopNarration();
    lastSpokenCueIdRef.current = '';
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
    soundEngine.stopNarration();
    lastSpokenCueIdRef.current = '';
  };

  const handleToggleVoiceover = () => {
    setVoiceoverEnabled((v) => {
      if (v) {
        soundEngine.stopNarration();
      } else if (isPlaying) {
        soundEngine.speakNarration(currentCue.voiceover);
      }
      return !v;
    });
  };

  const handleToggleMute = () => {
    setMuted((m) => {
      const next = !m;
      soundEngine.setMuted(next);
      return next;
    });
  };

  const handleSwitchToDrive = () => {
    setAppMode('drive');
    setIsPlaying(false);
    soundEngine.stopNarration();
    if (sceneRef.current) {
      sceneRef.current.cameraMode = cameraMode;
      sceneRef.current.setCinematicState(false, 0, 'cockpit', weather);
    }
  };

  const handleSwitchToTrailer = () => {
    setAppMode('trailer');
    setIsPlaying(true);
    if (sceneRef.current) {
      sceneRef.current.cameraMode = 'cockpit';
    }
  };

  const handleSelectCamera = (mode: CameraViewMode) => {
    setCameraMode(mode);
    if (sceneRef.current) {
      sceneRef.current.cameraMode = mode;
    }
  };

  const handleSelectWeather = (w: WeatherMode) => {
    setWeather(w);
    if (sceneRef.current) {
      sceneRef.current.setWeather(w);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 3D WebGL Canvas isolated mount container */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Persistent Top Navigation Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => setShowScriptModal(true)}
          className="flex items-center gap-1.5 bg-black/80 hover:bg-zinc-900 border border-zinc-700/80 hover:border-orange-500/80 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-tech font-bold transition shadow-lg cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-orange-400" />
          <span>PROMO SCRIPT BIBLE</span>
        </button>
      </div>

      {/* Mode-Specific HUD Overlays */}
      {appMode === 'trailer' ? (
        <>
          <TrailerPlayerHUD
            isPlaying={isPlaying}
            currentTime={currentTime}
            currentAct={currentAct}
            currentCue={currentCue}
            voiceoverEnabled={voiceoverEnabled}
            muted={muted}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onSeek={handleSeek}
            onRestart={handleRestart}
            onToggleVoiceover={handleToggleVoiceover}
            onToggleMute={handleToggleMute}
            onSwitchToDriveMode={handleSwitchToDrive}
          />

          {/* Act 4 (0:55 - 1:00) Title Reveal Overlay */}
          {currentTime >= 55 && (
            <TitleRevealOverlay
              onReplay={handleRestart}
              onDrive={handleSwitchToDrive}
            />
          )}
        </>
      ) : (
        <CockpitDashboardHUD
          telemetry={telemetry}
          cameraMode={cameraMode}
          weather={weather}
          onToggleStartStop={() => sceneRef.current?.toggleStartStop()}
          onToggleLaunchControl={() => sceneRef.current?.toggleLaunchControl()}
          onToggleTCS={() => sceneRef.current?.toggleTCS()}
          onShiftGear={(dir) => sceneRef.current?.shiftGear(dir)}
          onPullHandbrake={(active) => sceneRef.current?.pullHandbrake(active)}
          onSelectCamera={handleSelectCamera}
          onSelectWeather={handleSelectWeather}
          onSwitchToTrailerMode={handleSwitchToTrailer}
        />
      )}

      {/* Full Script & Director's Bible Modal */}
      {showScriptModal && (
        <ScriptTeleprompter
          onJumpToAct={(actNum, startSec) => {
            setAppMode('trailer');
            handleSeek(startSec);
            setIsPlaying(true);
          }}
          onClose={() => setShowScriptModal(false)}
        />
      )}
    </div>
  );
}
