export interface ScriptCue {
  id: string;
  actId: number;
  timeStart: number; // in seconds
  timeEnd: number;
  timecode: string;
  heading: string;
  location: string;
  visual: string;
  audio: string;
  voiceover: string;
  cockpitAction?: string;
  cameraPreset: 'times_square_macro' | 'cockpit_shifter' | 'cockpit_gauges' | 'rival_rev' | 'manhattan_drift' | 'cockpit_rearview' | 'brooklyn_sunset' | 'cop_chase' | 'snow_storm' | 'blockade_smash' | 'title_reveal';
  environmentPreset: 'neon_rain' | 'central_park_wet' | 'brooklyn_sunset' | 'manhattan_blizzard' | 'blackout';
}

export interface TrailerAct {
  actNumber: number;
  title: string;
  timeRange: string;
  durationSeconds: number;
  coreTheme: string;
  cues: ScriptCue[];
}

export const TRAILER_SCRIPT: TrailerAct[] = [
  {
    actNumber: 1,
    title: "THE AWAKENING & REALISTIC COCKPIT",
    timeRange: "0:00 - 0:15",
    durationSeconds: 15,
    coreTheme: "Atmospheric tension, hyper-realistic interior tactile mechanics, underground rivalry in rainy Times Square.",
    cues: [
      {
        id: "act1-scene1",
        actId: 1,
        timeStart: 0,
        timeEnd: 5,
        timecode: "0:00 - 0:05",
        heading: "EXT. TIMES SQUARE - MIDNIGHT - RAIN",
        location: "Times Square, 42nd & Broadway, Manhattan, NYC",
        visual: "Cinematic, slow-motion macro tracking shot gliding across the carbon-fiber front splitter of a hyper-realistic bespoke hypercar, parked beneath the blinding neon advertisements of Times Square. Puddles on the asphalt mirror towering digital billboards in 4K clarity. Raindrops slide realistically across glossy clearcoat paintwork, beading off aerodynamic louvers.",
        audio: "Soft, cinematic ambient synthesizer music swelling with low-frequency sub-bass tension. Gentle patter of authentic NYC rain hitting windshield glass and metallic bodywork.",
        voiceover: "They said the city never sleeps. But at midnight... New York doesn't sleep. It awakens.",
        cockpitAction: "Exterior beauty pan transitioning into driver's cabin.",
        cameraPreset: "times_square_macro",
        environmentPreset: "neon_rain"
      },
      {
        id: "act1-scene2",
        actId: 1,
        timeStart: 5,
        timeEnd: 10,
        timecode: "0:05 - 0:10",
        heading: "INT. HYPERCAR COCKPIT - CONTINUOUS",
        location: "Driver's Seat, Alcantara & Forged Carbon Interior",
        visual: "Camera cuts inside the meticulously modeled cockpit. The driver's gloved hand reaches toward the center console and firmly presses the knurled aluminum Engine Start/Stop button. The digital gauge cluster instantly boots with custom diagnostic telemetry; analog tachometer needle sweeps violently to 9,000 RPM. Driver grips the authentic flat-bottom Alcantara steering wheel, flips the Launch Control switch, and snaps the knurled billet paddle shifter into first gear.",
        audio: "The sharp, tactile mechanical click of the Start button, followed by the terrifying starter motor whine, then a deafening, thunderous ignition roar from a quad-turbocharged V12 engine. A crisp pneumatic 'clack' as the gear engages, accompanied by the high-pitch arming chime of the launch control system.",
        voiceover: "Every dial. Every mechanical switch. True tactile mastery. When you sit behind this wheel, you don't play a game... you commandeer eight hundred horses of pure asphalt fury.",
        cockpitAction: "Start/Stop button pressed -> Launch Control primed -> Paddle clicked -> Gauges illuminate to redline.",
        cameraPreset: "cockpit_gauges",
        environmentPreset: "neon_rain"
      },
      {
        id: "act1-scene3",
        actId: 1,
        timeStart: 10,
        timeEnd: 15,
        timecode: "0:10 - 0:15",
        heading: "EXT. / INT. TIMES SQUARE INTERSECTION - CONTINUOUS",
        location: "Pedestrian Plaza & Broadway Avenue, NYC",
        visual: "A widebody JDM legend clad in midnight chrome and carbon aero pulls alongside into the adjacent lane, tires spitting standing water. Driver looks to the left through rain-streaked side glass; the rival driver locks eyes through tinted visor and revs aggressively. Working side mirrors capture the reflection of Times Square's neon canyon vibrating to engine acoustic resonance. The pedestrian traffic signal turns from red hand to walking figure.",
        audio: "A dual symphony of twin-turbo anti-lag backfires: explosive two-step popcorn pops, screaming high-RPM rotary/inline-6 whine answering the deep V12 rumble, echoing off 42nd Street skyscrapers. Cinematic music hits a massive accelerating drum roll.",
        voiceover: "No waiting rooms. No server queues. Just you, your machine, and the rival daring to challenge your crown in the heart of Manhattan.",
        cockpitAction: "Two-step launch revving at 5,500 RPM; side mirrors vibrating with low-end resonance.",
        cameraPreset: "rival_rev",
        environmentPreset: "neon_rain"
      }
    ]
  },
  {
    actNumber: 2,
    title: "THE ASPHALT JUNGLE & DRIFT LEAGUE",
    timeRange: "0:15 - 0:30",
    durationSeconds: 15,
    coreTheme: "High-octane urban racing, physics-accurate drift simulation, redline manual shifts, Central Park precision.",
    cues: [
      {
        id: "act2-scene1",
        actId: 2,
        timeStart: 15,
        timeEnd: 22,
        timecode: "0:15 - 0:22",
        heading: "EXT. 5TH AVENUE TO CENTRAL PARK SOUTH - NIGHT",
        location: "5th Avenue & Central Park South Entrance, NYC",
        visual: "Sudden explosive launch! Launch control dumps the clutch; all four Michelin Pilot Sport Cup tires hook into wet asphalt with smoke and vapor geysers erupting from the wheel wells. Both cars rocket down 5th Avenue past iconic storefronts at 170+ MPH. Interior cut: Driver's hand slams through 2nd, 3rd, and 4th gear on the tactile manual gate at redline RPM, needle dancing in the danger zone.",
        audio: "Explosive transition into blistering high-energy hybrid electronic/rock trailer score with heavy distorted basslines and driving drums. Earth-shattering engine notes screaming through gear ratios, authentic wastegate flutters (pssh-t-t-t-t), and thunderous exhaust crackles on overrun.",
        voiceover: "Feel the uncompromised physics of real rubber meeting real road. Weight transfer that pushes your spine into the bucket seat. Handling tuned by true motorsport obsessives.",
        cockpitAction: "Rapid manual paddle upshifts; shift LEDs flashing amber to strobe red at 8,800 RPM.",
        cameraPreset: "manhattan_drift",
        environmentPreset: "central_park_wet"
      },
      {
        id: "act2-scene2",
        actId: 2,
        timeStart: 22,
        timeEnd: 30,
        timecode: "0:22 - 0:30",
        heading: "EXT. / INT. CENTRAL PARK LOOP - NIGHT",
        location: "Central Park West & East Drive Hairpins, NYC",
        visual: "Approaching a razor-sharp 110-degree hairpin curve framed by towering Manhattan skylines and autumn elm trees. Driver violently yanks the authentic aluminum handbrake lever inside the cockpit. The rear axle breaks loose into a textbook high-angle power drift. Camera swoops inches from the road, tracking molten rubber shredding against asphalt. Driver counter-steers rapidly on the interactive wheel. The fully functional convex rearview mirror shows the JDM rival violently spinning out behind into a plume of tire smoke.",
        audio: "Piercing, hyper-realistic tire screeches with pitch modulation as grip transitions to slip-angle. Violent gravel spray pinging against the carbon wheel arches. Bass drop with resonant audio whoosh as the drift clips the curb apex.",
        voiceover: "Conquer the sanctioned underground Drift League. Master every hairpin, clutch kick, and curb angle across New York's most unforgiving curves. Your skill. Your telemetry. Your undisputed podium.",
        cockpitAction: "Handbrake engaged -> counter-steering lock -> rear-view mirror displaying rival in dust.",
        cameraPreset: "cockpit_rearview",
        environmentPreset: "central_park_wet"
      }
    ]
  },
  {
    actNumber: 3,
    title: "THE PURSUIT & UNTETHERED FREEDOM",
    timeRange: "0:30 - 0:50",
    durationSeconds: 20,
    coreTheme: "High-stakes police pursuit on Brooklyn Bridge, dynamic weather transition into a blizzard, tactical pit evasion, and the ultimate offline freedom selling point.",
    cues: [
      {
        id: "act3-scene1",
        actId: 3,
        timeStart: 30,
        timeEnd: 37,
        timecode: "0:30 - 0:37",
        heading: "EXT. BROOKLYN BRIDGE - DUSK INTO NIGHT",
        location: "Brooklyn Bridge Main Span, East River, NYC",
        visual: "The race bursts onto the iconic wooden-and-asphalt deck of the Brooklyn Bridge. The sky is a breathtaking cinematic blend of burning amber sunset and deep violet storm clouds. Suddenly, blinding emergency strobes illuminate the suspension cables: four interceptor-spec police cruisers flank the bridge approach in high-speed pursuit. A squad car surges alongside and initiates an aggressive tactical PIT maneuver.",
        audio: "Ear-splitting dual-tone NYPD police sirens screaming in Doppler effect. Urgent police radio chatter crackling: 'All units on East River sector, suspect vehicle exceeding 190 MPH on the Brooklyn Bridge span! Authorize aggressive tactical intervention!' Tension-soaked trailer orchestral buildup.",
        voiceover: "When the city's finest mobilize, survival demands split-second instinct. No forgiving tracks. No guardrails.",
        cockpitAction: "Emergency flashers reflecting off side mirrors; siren strobes bouncing across Alcantara dash.",
        cameraPreset: "brooklyn_sunset",
        environmentPreset: "brooklyn_sunset"
      },
      {
        id: "act3-scene2",
        actId: 3,
        timeStart: 37,
        timeEnd: 44,
        timecode: "0:37 - 0:44",
        heading: "INT. COCKPIT / EXT. BROOKLYN BRIDGE - SUDDEN BLIZZARD",
        location: "Brooklyn Tower Promenade, Brooklyn Bridge, NYC",
        visual: "Dynamic weather strikes: temperature plunges and a sudden New York winter blizzard engulfs the bridge in swirling snow and ice particles. Interior view: The driver flips the cockpit's toggle switch for 'TCS / ESC' from 'ON' to 'OFF'. A red warning icon flashes on the telemetry screen. The driver executes a high-speed reverse-flick feint; the aggressive police cruiser overshoots, clips the concrete barrier in a spray of sparks, and spins harmlessly across the icy lanes.",
        audio: "Tactile metallic snap of the toggle switch. Engine RPM spikes into a manic roar as traction limits are bypassed. Snowflakes whip violently against windshield glass. Metal-on-concrete scraping crash and thunderous impact crunch of the patrol car deflecting.",
        voiceover: "Traction Control OFF. Pure unfiltered horsepower. Adapt to dynamic snow, rain, and midnight frost across the living, breathing five boroughs.",
        cockpitAction: "TCS toggle switch flicked to OFF; RPM needle pinning 9,200 limit.",
        cameraPreset: "snow_storm",
        environmentPreset: "manhattan_blizzard"
      },
      {
        id: "act3-scene3",
        actId: 3,
        timeStart: 44,
        timeEnd: 50,
        timecode: "0:44 - 0:50",
        heading: "EXT. FDR DRIVE / HUD GRAPHIC OVERLAY - CONTINUOUS",
        location: "FDR Drive Riverside Expressway, Manhattan, NYC",
        visual: "Camera pulls back to a high-speed third-person chase camera tearing down FDR Drive. A sleek, ultra-clean holographic HUD graphic pulses onto the screen: A Wi-Fi icon transitions to 'DISCONNECTED' with a clean cross-out, followed by glowing cyan text: '100% UNTETHERED • ZERO SERVERS • PLAY OFFLINE ANYWHERE'. The hyper-realistic graphics, ray-traced reflections, and intense cop pursuit continue entirely without stutter or interruption.",
        audio: "A clean futuristic digital confirmation tone. Music swells into a soaring, triumphant anthem combining synth-wave arpeggios and raw electric guitar riffs. Engine sound continues at full throttle.",
        voiceover: "And the ultimate superpower? Total untethered freedom. No Wi-Fi required. No mandatory logins. No server outages. The entire open world, the career, the garage, and the blacktop are ONE HUNDRED PERCENT OFFLINE.",
        cockpitAction: "Offline system HUD badge shines: 'LOCAL ARCHITECTURE VERIFIED - 0ms LATENCY'.",
        cameraPreset: "cop_chase",
        environmentPreset: "neon_rain"
      }
    ]
  },
  {
    actNumber: 4,
    title: "THE CLIMAX & TITLE REVEAL",
    timeRange: "0:50 - 1:00",
    durationSeconds: 10,
    coreTheme: "Blockade breach, adrenaline climax, photorealistic finish line crossing, cut to black, and legendary title reveal.",
    cues: [
      {
        id: "act4-scene1",
        actId: 4,
        timeStart: 50,
        timeEnd: 55,
        timecode: "0:50 - 0:55",
        heading: "EXT. LOWER MANHATTAN FINISH LINE - NIGHT",
        location: "Wall Street & Broad Street Intersection, Financial District, NYC",
        visual: "Ahead, the intersection is barricaded by heavy tactical police swat cruisers and sawhorse barricades with flashing halogen beacons. The player's hypercar does not slow down; it activates full twin-turbo nitrous boost. Flames shoot two feet from the dual center exhaust. The car narrowly smashes right through the wooden blockade sawhorse, scattering splintered barriers and incandescent sparks across the camera lens, barreling past the neon-lit finish line banners at 220 MPH!",
        audio: "Full-throttle nitrous injection whoosh! Massive splintering wood and crunching barricade impact sound. Screaming crowds cheering in the underground distance. The music peaks at its absolute loudest, most cinematic crescendo.",
        voiceover: "Break the blockade. Shatter the records. Claim the city.",
        cockpitAction: "Nitrous boost triggered -> speed gauge pins 224 MPH -> sparks illuminate the windshield.",
        cameraPreset: "blockade_smash",
        environmentPreset: "neon_rain"
      },
      {
        id: "act4-scene2",
        actId: 4,
        timeStart: 55,
        timeEnd: 60,
        timecode: "0:55 - 1:00",
        heading: "BLACK SCREEN / TITLE CARD",
        location: "Cinematic Title Reveal & Platform Bumper",
        visual: "Sudden, abrupt, bone-jarring CUT TO BLACK. In the pitch blackness, bold metallic-cyan and crimson chrome 3D typography smashes onto screen with kinetic particle embers: 'NEON HORIZON: NYC OFF-GRID'. Beneath the title, a sleek badge reads: 'NEXT-GEN COCKPIT SIMULATION • 100% OFFLINE OPEN WORLD'. Final bumper shows: 'COMING TO PC & CONSOLES • NO INTERNET CONNECTION REQUIRED'.",
        audio: "Explosive cinematic sub-bass braam boom upon the cut to black! In the quiet aftermath, a single, throat-clearing throttle rev of an ultra-rare V12 hypercar echoes through an empty urban tunnel, fading slowly into distant echoing sirens.",
        voiceover: "Neon Horizon: NYC Off-Grid. Next-gen racing doesn't need a connection to rule the road. Take the wheel.",
        cockpitAction: "Fade to black title lockup.",
        cameraPreset: "title_reveal",
        environmentPreset: "blackout"
      }
    ]
  }
];

export const GAME_CORE_FEATURES = [
  {
    title: "1:1 Photorealistic New York City",
    category: "World Setting",
    icon: "MapPin",
    highlight: "Times Square, Brooklyn Bridge, Central Park & Manhattan",
    description: "Every street, landmark, asphalt grade, and building facade laser-modeled from real NYC geodata for an authentic open-world experience."
  },
  {
    title: "Hyper-Realistic Graphics & Weather",
    category: "Visual Engine",
    icon: "Sparkles",
    highlight: "PBR Shading, Real-time Reflections & Dynamic Seasons",
    description: "Next-gen ray-traced puddle reflections, dynamic rain, sudden blinding blizzards, and neon night lighting. Strictly zero voxels or cartoon aesthetics."
  },
  {
    title: "Interactive Mechanical Cockpit",
    category: "Cockpit & Controls",
    icon: "Gauge",
    highlight: "Functional Start/Stop, Gauges, Paddles, Mirrors, TCS & Launch Control",
    description: "Every button in the cabin is fully interactive. Functional analog/digital tachometers, working convex mirrors, physical handbrake, and authentic H-shifter/paddles."
  },
  {
    title: "Street Racing, Drift League & High-Speed Pursuit",
    category: "Game Modes",
    icon: "Flame",
    highlight: "Underground Rivalries, Hairpin Drifting & Tactical Police Evasion",
    description: "Battle illegal street rivals across the 5 boroughs, compete on precision drift leaderboards in Central Park, and escape tactical NYPD pit maneuvers."
  },
  {
    title: "100% Truly Offline Experience",
    category: "Zero Online Dependency",
    icon: "WifiOff",
    highlight: "Zero Servers • Zero Mandatory Logins • Play Anywhere",
    description: "The entire massive open world, complete career mode, police pursuits, and deep car customization run 100% locally on your machine with 0ms server latency."
  },
  {
    title: "Authentic Motorsport Audio & Physics",
    category: "Audio & Simulation",
    icon: "Volume2",
    highlight: "V8/V10/V12 Acoustic Synthesis, Real Tire Slip & Police Sirens",
    description: "True-to-life vehicle kinematics, authentic weight transfer, roaring exhaust notes, turbo blow-off valve flutter, and dual-tone emergency wails."
  }
];
