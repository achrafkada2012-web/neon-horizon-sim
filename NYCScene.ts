/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/soundEngine.ts';

// Pre-allocated math variables for zero-GC render loop
const _vec3 = new THREE.Vector3();
const _camPosTarget = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();

export type CameraViewMode = 'cockpit' | 'chase' | 'hood' | 'cinematic';
export type WeatherMode = 'neon_rain' | 'brooklyn_sunset' | 'central_park_wet' | 'manhattan_blizzard' | 'blackout';

export interface VehicleTelemetry {
  speedMph: number;
  rpm: number;
  gear: number; // -1 = R, 0 = N, 1..6
  isEngineRunning: boolean;
  launchControlArmed: boolean;
  tcsMode: 'ON' | 'SPORT' | 'OFF';
  boostPsi: number;
  steeringAngle: number;
  isDrifting: boolean;
  isBraking: boolean;
  handbrakeActive: boolean;
  offlineStatus: boolean;
}

export class NYCScene {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private rearCamera!: THREE.PerspectiveCamera;
  private rearRenderTarget!: THREE.WebGLRenderTarget;

  private clock = new THREE.Clock();
  private animFrameId: number | null = null;
  private isDisposed = false;

  // Scene elements
  private playerCarGroup = new THREE.Group();
  private rivalCarGroup = new THREE.Group();
  private policeCarGroup = new THREE.Group();
  private cityGroup = new THREE.Group();
  private weatherParticles!: THREE.Points;
  private sparksParticles!: THREE.Points;
  private smokeParticles!: THREE.Points;

  // Cockpit interactive sub-elements
  private steeringWheelMesh!: THREE.Group;
  private tachometerNeedle!: THREE.Mesh;
  private startButtonMesh!: THREE.Mesh;
  private launchButtonMesh!: THREE.Mesh;
  private tcsSwitchMesh!: THREE.Mesh;
  private shifterPaddleLeft!: THREE.Mesh;
  private shifterPaddleRight!: THREE.Mesh;
  private rearviewMirrorMesh!: THREE.Mesh;

  // Lighting rigs
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private policeLightRed!: THREE.PointLight;
  private policeLightBlue!: THREE.PointLight;

  // Materials for dynamic tuning
  private roadMaterial!: THREE.MeshStandardMaterial;
  private puddlesMaterial!: THREE.MeshStandardMaterial;
  private carPaintMaterial!: THREE.MeshPhysicalMaterial;

  // Telemetry & Control State
  public telemetry: VehicleTelemetry = {
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
  };

  public cameraMode: CameraViewMode = 'cockpit';
  public weather: WeatherMode = 'neon_rain';

  // Manual drive inputs
  public inputs = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false
  };

  // Cinematic script playback parameters
  private cinematicTime = 0;
  private isCinematicPlaying = false;
  private cinematicPreset: string = 'times_square_macro';

  // Listeners
  public onTelemetryUpdate?: (telem: VehicleTelemetry) => void;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.init();
  }

  private init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene & Renderer Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x060814, 0.007);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 2. Camera Setup
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 800);
    this.camera.position.set(0, 1.2, -0.2); // Default cockpit eye position

    // 3. Working Rearview Mirror Camera & RenderTarget
    this.rearRenderTarget = new THREE.WebGLRenderTarget(256, 128, {
      generateMipmaps: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });
    this.rearCamera = new THREE.PerspectiveCamera(50, 2, 0.2, 200);

    // 4. Studio Environment Map (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Build Scene Content
    this.setupLighting();
    this.buildCityEnvironment();
    this.buildPlayerHypercar();
    this.buildRivalCar();
    this.buildPoliceInterceptor();
    this.setupWeatherParticles();
    this.setupSmokeAndSparks();

    this.scene.add(this.cityGroup);
    this.scene.add(this.playerCarGroup);
    this.scene.add(this.rivalCarGroup);
    this.scene.add(this.policeCarGroup);

    // Set initial weather
    this.setWeather('neon_rain');

    // Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);

    // Start audio engine
    soundEngine.startEngineSound(850);

    // Start render loop
    this.tick();
  }

  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0x3a506b, 0x050508, 0.6);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    this.keyLight.position.set(20, 40, 20);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 5;
    this.keyLight.shadow.camera.far = 120;
    const d = 30;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Police strobes
    this.policeLightRed = new THREE.PointLight(0xff1122, 0, 35);
    this.policeLightBlue = new THREE.PointLight(0x0066ff, 0, 35);
    this.scene.add(this.policeLightRed);
    this.scene.add(this.policeLightBlue);
  }

  // ---- CITY GENERATION (NYC 1:1 VIBE) ----
  private buildCityEnvironment() {
    // Wet Asphalt Road
    const roadGeo = new THREE.PlaneGeometry(36, 1200);
    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x111116,
      roughness: 0.15,
      metalness: 0.35
    });
    const road = new THREE.Mesh(roadGeo, this.roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 0);
    road.receiveShadow = true;
    this.cityGroup.add(road);

    // Road Markings (Yellow double-center lines & White lane dividers)
    const lineGeo = new THREE.PlaneGeometry(0.35, 1200);
    const lineMat = new THREE.MeshStandardMaterial({
      color: 0xf5a623,
      roughness: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const centerLine1 = new THREE.Mesh(lineGeo, lineMat);
    centerLine1.rotation.x = -Math.PI / 2;
    centerLine1.position.set(-0.25, 0.01, 0);
    this.cityGroup.add(centerLine1);

    const centerLine2 = new THREE.Mesh(lineGeo, lineMat);
    centerLine2.rotation.x = -Math.PI / 2;
    centerLine2.position.set(0.25, 0.01, 0);
    this.cityGroup.add(centerLine2);

    // Sidewalks
    const curbGeo = new THREE.BoxGeometry(6, 0.3, 1200);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x33333b, roughness: 0.8 });
    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-21, 0.15, 0);
    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(21, 0.15, 0);
    this.cityGroup.add(leftCurb);
    this.cityGroup.add(rightCurb);

    // Skyscraper Canyons with Neon Billboards (Times Square Style)
    const buildingMatDark = new THREE.MeshStandardMaterial({ color: 0x090b10, roughness: 0.7, metalness: 0.2 });
    const buildingMatGlass = new THREE.MeshPhysicalMaterial({
      color: 0x182232,
      roughness: 0.1,
      metalness: 0.9,
      transmission: 0.2
    });

    const billboardColors = [0x00f0ff, 0xff0055, 0xffb703, 0x7209b7, 0x00ff88];

    for (let z = -500; z <= 500; z += 55) {
      // Left side skyscraper
      const hLeft = 60 + Math.random() * 80;
      const bLeftGeo = new THREE.BoxGeometry(22, hLeft, 45);
      const bLeft = new THREE.Mesh(bLeftGeo, Math.random() > 0.5 ? buildingMatGlass : buildingMatDark);
      bLeft.position.set(-35, hLeft / 2, z);
      this.cityGroup.add(bLeft);

      // Right side skyscraper
      const hRight = 70 + Math.random() * 90;
      const bRightGeo = new THREE.BoxGeometry(22, hRight, 45);
      const bRight = new THREE.Mesh(bRightGeo, Math.random() > 0.5 ? buildingMatGlass : buildingMatDark);
      bRight.position.set(35, hRight / 2, z);
      this.cityGroup.add(bRight);

      // Glowing Neon Billboards
      if (Math.abs(z) % 110 === 0) {
        const boardColor = billboardColors[Math.floor(Math.random() * billboardColors.length)];
        const boardGeo = new THREE.PlaneGeometry(16, 22);
        const boardMat = new THREE.MeshBasicMaterial({ color: boardColor });
        const boardMesh = new THREE.Mesh(boardGeo, boardMat);
        boardMesh.position.set(-23.9, 28, z);
        boardMesh.rotation.y = Math.PI / 2;
        this.cityGroup.add(boardMesh);

        // Billboard glow light
        const boardLight = new THREE.PointLight(boardColor, 3, 40);
        boardLight.position.set(-20, 28, z);
        this.cityGroup.add(boardLight);
      }
    }

    // Brooklyn Bridge Suspension Arches (at z = 150 to 280)
    this.buildBrooklynBridgeSpan();

    // Finish Line Truss & Police Sawhorse Barricades (at z = 380)
    this.buildFinishLineAndBlockade();
  }

  private buildBrooklynBridgeSpan() {
    const bridgeGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a504a, roughness: 0.85 });
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 });

    // Gothic Arch 1
    const tower1 = new THREE.Mesh(new THREE.BoxGeometry(8, 70, 8), stoneMat);
    tower1.position.set(-18, 35, 180);
    const tower2 = new THREE.Mesh(new THREE.BoxGeometry(8, 70, 8), stoneMat);
    tower2.position.set(18, 35, 180);
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(44, 10, 8), stoneMat);
    archTop.position.set(0, 65, 180);

    bridgeGroup.add(tower1, tower2, archTop);

    // Steel diagonal cables
    for (let i = -12; i <= 12; i += 4) {
      const cableGeo = new THREE.CylinderGeometry(0.08, 0.08, 55);
      const cable = new THREE.Mesh(cableGeo, cableMat);
      cable.position.set(i > 0 ? 17.5 : -17.5, 35, 180 + i * 4);
      cable.rotation.z = i > 0 ? -0.15 : 0.15;
      bridgeGroup.add(cable);
    }

    this.cityGroup.add(bridgeGroup);
  }

  private buildFinishLineAndBlockade() {
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.9, roughness: 0.2 });
    const finishTruss = new THREE.Mesh(new THREE.BoxGeometry(36, 1.5, 1.5), trussMat);
    finishTruss.position.set(0, 9, 390);

    const postL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 9, 1.5), trussMat);
    postL.position.set(-17, 4.5, 390);
    const postR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 9, 1.5), trussMat);
    postR.position.set(17, 4.5, 390);

    // Overhead Checkered Banner
    const bannerGeo = new THREE.PlaneGeometry(28, 4);
    const bannerMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 8, 389.9);
    banner.rotation.y = Math.PI;

    this.cityGroup.add(finishTruss, postL, postR, banner);

    // Sawhorse Police Blockade at z = 370
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xf5a623, roughness: 0.7 });
    for (let x = -8; x <= 8; x += 4) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.4, 0.2), woodMat);
      bar.position.set(x, 1.0, 368);
      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2), woodMat);
      leg1.position.set(x - 1.2, 0.6, 368);
      const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2), woodMat);
      leg2.position.set(x + 1.2, 0.6, 368);
      this.cityGroup.add(bar, leg1, leg2);
    }
  }

  // ---- PLAYER HYPERCAR & DETAILED COCKPIT ----
  private buildPlayerHypercar() {
    // Outer Chassis
    this.carPaintMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x05f0e4, // High-voltage Cyan
      metalness: 0.85,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });

    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.4, metalness: 0.6 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x050a12,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      ior: 1.52,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });

    // 1. Aerodynamic Body Shell (Composite THREE.Group)
    const bodyMain = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 4.6), this.carPaintMaterial);
    bodyMain.position.set(0, 0.55, 0);
    bodyMain.castShadow = true;
    this.playerCarGroup.add(bodyMain);

    // Front low splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.08, 1.2), carbonMat);
    splitter.position.set(0, 0.18, 2.3);
    this.playerCarGroup.add(splitter);

    // Cockpit Roof & Windshield Greenhouse
    const greenhouse = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.55, 2.0), glassMat);
    greenhouse.position.set(0, 1.0, -0.1);
    this.playerCarGroup.add(greenhouse);

    // Rear Aero Wing
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.45), carbonMat);
    wingBlade.position.set(0, 1.15, -2.1);
    const wingStalkL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4), carbonMat);
    wingStalkL.position.set(-0.65, 0.95, -2.05);
    const wingStalkR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4), carbonMat);
    wingStalkR.position.set(0.65, 0.95, -2.05);
    this.playerCarGroup.add(wingBlade, wingStalkL, wingStalkR);

    // Quad Wheels with red brake calipers
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0d, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.9, roughness: 0.15 });

    const wheelPositions = [
      [-1.05, 0.38, 1.45],
      [1.05, 0.38, 1.45],
      [-1.05, 0.42, -1.45],
      [1.05, 0.42, -1.45]
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.32, 24), wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, y, z);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.33, 16), rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(x, y, z);
      this.playerCarGroup.add(tire, rim);
    });

    // Headlights (LED Cyan)
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.1), lightMat);
    headL.position.set(-0.75, 0.65, 2.3);
    const headR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.1), lightMat);
    headR.position.set(0.75, 0.65, 2.3);
    this.playerCarGroup.add(headL, headR);

    // Tail LED Strip
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.05), tailMat);
    tailBar.position.set(0, 0.72, -2.31);
    this.playerCarGroup.add(tailBar);

    // ==========================================
    // INTERACTIVE HIGH-PRECISION COCKPIT INTERIOR
    // ==========================================
    const cockpitGroup = new THREE.Group();
    cockpitGroup.position.set(0, 0.68, 0.1);

    // Alcantara Dash Shell
    const alcantaraMat = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.95 });
    const dashBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.85), alcantaraMat);
    dashBase.position.set(0, 0.2, 0.45);
    cockpitGroup.add(dashBase);

    // Center Console Tunnel
    const consoleMat = new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.3, metalness: 0.8 });
    const consoleTunnel = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.9), consoleMat);
    consoleTunnel.position.set(0, 0.05, 0.0);
    cockpitGroup.add(consoleTunnel);

    // Flat-bottom Alcantara & Carbon Steering Wheel
    this.steeringWheelMesh = new THREE.Group();
    this.steeringWheelMesh.position.set(-0.38, 0.34, 0.28);
    this.steeringWheelMesh.rotation.x = 0.25;

    const rimWheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.022, 16, 32), alcantaraMat);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), carbonMat);
    hub.rotation.x = Math.PI / 2;
    this.steeringWheelMesh.add(rimWheel, hub);

    // Knurled Billet Paddle Shifters (Left / Right behind wheel)
    const paddleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
    this.shifterPaddleLeft = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.01), paddleMat);
    this.shifterPaddleLeft.position.set(-0.16, 0.02, -0.04);
    this.shifterPaddleRight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.01), paddleMat);
    this.shifterPaddleRight.position.set(0.16, 0.02, -0.04);
    this.steeringWheelMesh.add(this.shifterPaddleLeft, this.shifterPaddleRight);

    cockpitGroup.add(this.steeringWheelMesh);

    // Working Digital / Analog Gauge Cluster
    const gaugeBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.02), new THREE.MeshBasicMaterial({ color: 0x05070a }));
    gaugeBack.position.set(-0.38, 0.35, 0.55);
    gaugeBack.rotation.x = -0.15;

    // Analog Tachometer Needle (rotates around Z with RPM)
    const needleGeo = new THREE.BoxGeometry(0.008, 0.08, 0.004);
    needleGeo.translate(0, 0.04, 0);
    const needleMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    this.tachometerNeedle = new THREE.Mesh(needleGeo, needleMat);
    this.tachometerNeedle.position.set(-0.38, 0.35, 0.565);
    cockpitGroup.add(gaugeBack, this.tachometerNeedle);

    // Glowing Start/Stop Engine Button on Console
    const startBtnGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.015, 24);
    const startBtnMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    this.startButtonMesh = new THREE.Mesh(startBtnGeo, startBtnMat);
    this.startButtonMesh.position.set(0, 0.21, 0.22);
    cockpitGroup.add(this.startButtonMesh);

    // Launch Control Switch (Billet aluminum with amber LED)
    const launchBtnGeo = new THREE.BoxGeometry(0.03, 0.02, 0.03);
    const launchBtnMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    this.launchButtonMesh = new THREE.Mesh(launchBtnGeo, launchBtnMat);
    this.launchButtonMesh.position.set(0.08, 0.21, 0.22);
    cockpitGroup.add(this.launchButtonMesh);

    // Traction Control (TCS) Toggle
    const tcsGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.03, 12);
    const tcsMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 });
    this.tcsSwitchMesh = new THREE.Mesh(tcsGeo, tcsMat);
    this.tcsSwitchMesh.position.set(-0.08, 0.22, 0.22);
    this.tcsSwitchMesh.rotation.z = -0.3; // Default ON
    cockpitGroup.add(this.tcsSwitchMesh);

    // Center Console Manual Gear Stick
    const stickShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.14), carbonMat);
    stickShaft.position.set(0, 0.25, 0.05);
    const stickKnob = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 16), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95 }));
    stickKnob.position.set(0, 0.32, 0.05);
    cockpitGroup.add(stickShaft, stickKnob);

    // Real-time Working Rearview Mirror
    const mirrorHousing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.02), carbonMat);
    mirrorHousing.position.set(0, 0.65, 0.32);
    const mirrorReflectGeo = new THREE.PlaneGeometry(0.26, 0.07);
    const mirrorReflectMat = new THREE.MeshBasicMaterial({
      map: this.rearRenderTarget.texture
    });
    this.rearviewMirrorMesh = new THREE.Mesh(mirrorReflectGeo, mirrorReflectMat);
    this.rearviewMirrorMesh.position.set(0, 0.65, 0.31);
    this.rearviewMirrorMesh.rotation.y = Math.PI; // Look backwards
    cockpitGroup.add(mirrorHousing, this.rearviewMirrorMesh);

    // Left and Right Side Mirrors
    const sideMirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.02), carbonMat);
    sideMirrorL.position.set(-1.05, 0.35, 0.45);
    sideMirrorL.rotation.y = -0.35;
    const sideMirrorR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.02), carbonMat);
    sideMirrorR.position.set(1.05, 0.35, 0.45);
    sideMirrorR.rotation.y = 0.35;
    cockpitGroup.add(sideMirrorL, sideMirrorR);

    this.playerCarGroup.add(cockpitGroup);
  }

  // ---- JDM LEGEND RIVAL ----
  private buildRivalCar() {
    this.rivalCarGroup.position.set(4.5, 0, 0);

    const rivalPaint = new THREE.MeshPhysicalMaterial({
      color: 0x7b2cbf, // Midnight Purple
      metalness: 0.8,
      roughness: 0.2
    });
    const carbon = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });

    // Widebody JDM coupe silhouette
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 4.4), rivalPaint);
    body.position.set(0, 0.6, 0);
    body.castShadow = true;

    // Vented hood
    const hoodScoop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.9), carbon);
    hoodScoop.position.set(0, 0.96, 1.2);

    // Tall GT Carbon Wing
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.4), carbon);
    wing.position.set(0, 1.35, -2.0);

    // Quad Titanium Exhaust Tips with heat bluing
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x3a86ff, metalness: 0.9, roughness: 0.2 });
    for (let x = -0.3; x <= 0.3; x += 0.2) {
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2), exhaustMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(x, 0.35, -2.25);
      this.rivalCarGroup.add(tip);
    }

    this.rivalCarGroup.add(body, hoodScoop, wing);
  }

  // ---- NYPD INTERCEPTOR POLICE CRUISER ----
  private buildPoliceInterceptor() {
    this.policeCarGroup.position.set(-5.5, 0, -25);

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.4 });
    const pushbarMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });

    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.8, 4.8), blackMat);
    mainBody.position.set(0, 0.65, 0);

    // White door wrap
    const doorWrap = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.6, 2.0), whiteMat);
    doorWrap.position.set(0, 0.65, 0);

    // Heavy tactical Pushbar bumper (for PIT maneuvers)
    const pushbar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.3), pushbarMat);
    pushbar.position.set(0, 0.55, 2.5);

    // Roof Police Lightbar (Red and Blue Strobes)
    const barFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.25), pushbarMat);
    barFrame.position.set(0, 1.25, 0.1);

    const redStrobe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.2), new THREE.MeshBasicMaterial({ color: 0xff0022 }));
    redStrobe.position.set(-0.35, 1.25, 0.1);
    const blueStrobe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.2), new THREE.MeshBasicMaterial({ color: 0x0055ff }));
    blueStrobe.position.set(0.35, 1.25, 0.1);

    this.policeCarGroup.add(mainBody, doorWrap, pushbar, barFrame, redStrobe, blueStrobe);
  }

  // ---- PARTICLES: RAIN, BLIZZARD, TIRE SMOKE, SPARKS ----
  private setupWeatherParticles() {
    const count = 3500;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.18,
      transparent: true,
      opacity: 0.65
    });

    this.weatherParticles = new THREE.Points(geo, mat);
    this.scene.add(this.weatherParticles);
  }

  private setupSmokeAndSparks() {
    // Tire Smoke
    const smokeCount = 800;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePos = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount; i++) {
      smokePos[i * 3] = (Math.random() - 0.5) * 4;
      smokePos[i * 3 + 1] = Math.random() * 2;
      smokePos[i * 3 + 2] = -2 - Math.random() * 15;
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    this.smokeParticles = new THREE.Points(smokeGeo, new THREE.PointsMaterial({
      color: 0xcccccc,
      size: 0.45,
      transparent: true,
      opacity: 0.35
    }));
    this.playerCarGroup.add(this.smokeParticles);

    // Sparks for PIT maneuvers and Blockade smash
    const sparkCount = 300;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3] = (Math.random() - 0.5) * 3;
      sparkPos[i * 3 + 1] = 0.2 + Math.random() * 1.5;
      sparkPos[i * 3 + 2] = 2.0 + Math.random() * 3;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    this.sparksParticles = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.2,
      transparent: true,
      opacity: 0.85
    }));
    this.sparksParticles.visible = false;
    this.playerCarGroup.add(this.sparksParticles);
  }

  // ---- WEATHER & TIME OF DAY PRESETS ----
  public setWeather(mode: WeatherMode) {
    this.weather = mode;
    if (mode === 'neon_rain') {
      this.scene.fog = new THREE.FogExp2(0x060814, 0.007);
      this.hemiLight.color.setHex(0x3a506b);
      this.keyLight.color.setHex(0xffeedd);
      this.keyLight.intensity = 1.2;
      this.roadMaterial.roughness = 0.12;
      this.weatherParticles.visible = true;
      (this.weatherParticles.material as THREE.PointsMaterial).color.setHex(0x88ccff);
      (this.weatherParticles.material as THREE.PointsMaterial).size = 0.15;
    } else if (mode === 'brooklyn_sunset') {
      this.scene.fog = new THREE.FogExp2(0x281216, 0.006);
      this.hemiLight.color.setHex(0xff7b00);
      this.keyLight.color.setHex(0xffaa44);
      this.keyLight.intensity = 2.0;
      this.roadMaterial.roughness = 0.3;
      this.weatherParticles.visible = false;
    } else if (mode === 'central_park_wet') {
      this.scene.fog = new THREE.FogExp2(0x071110, 0.008);
      this.hemiLight.color.setHex(0x2d6a4f);
      this.keyLight.color.setHex(0xd8f3dc);
      this.keyLight.intensity = 1.1;
      this.roadMaterial.roughness = 0.18;
      this.weatherParticles.visible = true;
    } else if (mode === 'manhattan_blizzard') {
      this.scene.fog = new THREE.FogExp2(0x1a2436, 0.014);
      this.hemiLight.color.setHex(0x8ecae6);
      this.keyLight.color.setHex(0xffffff);
      this.keyLight.intensity = 0.9;
      this.roadMaterial.roughness = 0.55;
      this.weatherParticles.visible = true;
      (this.weatherParticles.material as THREE.PointsMaterial).color.setHex(0xffffff);
      (this.weatherParticles.material as THREE.PointsMaterial).size = 0.35;
    } else if (mode === 'blackout') {
      this.scene.fog = new THREE.FogExp2(0x000000, 0.05);
      this.hemiLight.color.setHex(0x000000);
      this.keyLight.intensity = 0;
      this.weatherParticles.visible = false;
    }
  }

  // ---- INTERACTIVE COCKPIT CONTROLS ----
  public toggleStartStop() {
    this.telemetry.isEngineRunning = !this.telemetry.isEngineRunning;
    soundEngine.playStartButtonSound(this.telemetry.isEngineRunning);
    (this.startButtonMesh.material as THREE.MeshBasicMaterial).color.setHex(
      this.telemetry.isEngineRunning ? 0x00ff66 : 0xff0033
    );

    if (!this.telemetry.isEngineRunning) {
      soundEngine.stopEngineSound();
      this.telemetry.rpm = 0;
      this.telemetry.speedMph = 0;
    } else {
      this.telemetry.rpm = 850;
    }
  }

  public toggleLaunchControl() {
    if (!this.telemetry.isEngineRunning) return;
    this.telemetry.launchControlArmed = !this.telemetry.launchControlArmed;
    soundEngine.playLaunchControlArm();
    (this.launchButtonMesh.material as THREE.MeshBasicMaterial).color.setHex(
      this.telemetry.launchControlArmed ? 0xffb703 : 0x333333
    );
  }

  public toggleTCS() {
    soundEngine.playToggleSwitchSound();
    if (this.telemetry.tcsMode === 'ON') {
      this.telemetry.tcsMode = 'SPORT';
      this.tcsSwitchMesh.rotation.z = 0;
    } else if (this.telemetry.tcsMode === 'SPORT') {
      this.telemetry.tcsMode = 'OFF';
      this.tcsSwitchMesh.rotation.z = 0.3;
    } else {
      this.telemetry.tcsMode = 'ON';
      this.tcsSwitchMesh.rotation.z = -0.3;
    }
  }

  public shiftGear(direction: 1 | -1) {
    if (!this.telemetry.isEngineRunning) return;
    const oldGear = this.telemetry.gear;
    const newGear = Math.max(1, Math.min(6, oldGear + direction));
    if (oldGear !== newGear) {
      this.telemetry.gear = newGear;
      soundEngine.playPaddleShiftClick();
      // Drop RPM slightly on upshift or spike on downshift
      if (direction === 1) {
        this.telemetry.rpm = Math.max(2200, this.telemetry.rpm - 2600);
        soundEngine.playTurboBlowOff();
      } else {
        this.telemetry.rpm = Math.min(9200, this.telemetry.rpm + 2800);
      }
    }
  }

  public pullHandbrake(active: boolean) {
    this.telemetry.handbrakeActive = active;
    if (active) {
      soundEngine.playHandbrakeSound();
      if (this.telemetry.speedMph > 20) {
        this.telemetry.isDrifting = true;
      }
    }
  }

  // ---- CINEMATIC TRAILER DIRECTOR CONTROL ----
  public setCinematicState(isPlaying: boolean, timeSeconds: number, cameraPreset: string, envPreset: WeatherMode) {
    this.isCinematicPlaying = isPlaying;
    this.cinematicTime = timeSeconds;
    this.cinematicPreset = cameraPreset;
    this.setWeather(envPreset);

    // Sync trailer audio & cues
    if (isPlaying) {
      // Act 3 police sirens
      if (timeSeconds >= 30 && timeSeconds < 55) {
        soundEngine.setPoliceSiren(true);
      } else {
        soundEngine.setPoliceSiren(false);
      }

      // Act 4 Blockade smash sparks
      if (timeSeconds >= 50 && timeSeconds <= 54) {
        this.sparksParticles.visible = true;
      } else {
        this.sparksParticles.visible = false;
      }
    }
  }

  // ---- TICK SIMULATION LOOP ----
  private tick = () => {
    if (this.isDisposed) return;
    this.animFrameId = requestAnimationFrame(this.tick);

    const delta = Math.min(this.clock.getDelta(), 0.05);

    // 1. Vehicle Physics & Driving Logic
    this.updateVehiclePhysics(delta);

    // 2. Camera Choreography (Cinematic vs Free Cockpit/Chase)
    this.updateCamera(delta);

    // 3. Dynamic Animated Lights & Weather
    this.updateEffects(delta);

    // 4. Working Rearview Mirror Pass
    this.renderRearviewMirror();

    // 5. Main Viewport Render
    this.renderer.render(this.scene, this.camera);

    // 6. Notify React HUD
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({ ...this.telemetry });
    }
  };

  private updateVehiclePhysics(delta: number) {
    if (this.isCinematicPlaying) {
      // Scripted cinematic telemetry
      this.scriptedCinematicPhysics(this.cinematicTime);
      return;
    }

    if (!this.telemetry.isEngineRunning) {
      this.telemetry.speedMph = THREE.MathUtils.damp(this.telemetry.speedMph, 0, 3, delta);
      this.telemetry.rpm = THREE.MathUtils.damp(this.telemetry.rpm, 0, 5, delta);
      return;
    }

    const { throttle, brake, steer, handbrake } = this.inputs;

    // Steering input damping
    this.telemetry.steeringAngle = THREE.MathUtils.damp(this.telemetry.steeringAngle, steer * 0.6, 12, delta);
    this.steeringWheelMesh.rotation.z = -this.telemetry.steeringAngle * 2.5;

    // Acceleration & Gear ratios
    const gearRatios = [0, 3.8, 2.6, 1.9, 1.4, 1.05, 0.85];
    const currentRatio = gearRatios[this.telemetry.gear] || 1.0;

    if (throttle > 0) {
      const topSpeedPerGear = [0, 55, 95, 140, 185, 220, 248];
      const maxSpeed = topSpeedPerGear[this.telemetry.gear];

      const accelForce = 45 * (currentRatio / 1.5) * throttle;
      this.telemetry.speedMph = Math.min(maxSpeed, this.telemetry.speedMph + accelForce * delta);

      // RPM calculation
      const targetRpm = 1000 + (this.telemetry.speedMph / maxSpeed) * 8200;
      this.telemetry.rpm = THREE.MathUtils.damp(this.telemetry.rpm, targetRpm, 10, delta);

      // Turbo boost
      this.telemetry.boostPsi = THREE.MathUtils.damp(this.telemetry.boostPsi, 24.5 * throttle, 6, delta);
    } else {
      // Coasting deceleration
      this.telemetry.speedMph = Math.max(0, this.telemetry.speedMph - 12 * delta);
      this.telemetry.rpm = THREE.MathUtils.damp(this.telemetry.rpm, 950 + this.telemetry.speedMph * 20, 4, delta);
      this.telemetry.boostPsi = THREE.MathUtils.damp(this.telemetry.boostPsi, 0, 8, delta);
    }

    if (brake > 0) {
      this.telemetry.speedMph = Math.max(0, this.telemetry.speedMph - 65 * brake * delta);
      this.telemetry.rpm = Math.max(850, this.telemetry.rpm - 1500 * delta);
    }

    // Drift physics
    const isDrift = (handbrake || (this.telemetry.tcsMode === 'OFF' && Math.abs(steer) > 0.4 && this.telemetry.speedMph > 40));
    this.telemetry.isDrifting = isDrift;
    soundEngine.setTireScreech(isDrift, Math.min(1.0, this.telemetry.speedMph / 80));

    // Move player car forward
    const speedUnits = (this.telemetry.speedMph * 0.447) * delta;
    this.playerCarGroup.position.z += speedUnits;
    this.playerCarGroup.position.x += this.telemetry.steeringAngle * speedUnits * 0.6;

    // Bounds check to loop Manhattan grid smoothly
    if (this.playerCarGroup.position.z > 500) {
      this.playerCarGroup.position.z = -450;
    }

    // Tachometer needle sweep (maps 0-9000 RPM to -2.3 to 2.3 radians)
    const angle = -2.3 + (this.telemetry.rpm / 9000) * 4.6;
    this.tachometerNeedle.rotation.z = -angle;

    // Sound engine RPM update
    soundEngine.setEngineRPM(this.telemetry.rpm);
  }

  private scriptedCinematicPhysics(t: number) {
    // Act 1 (0-15s): Idle to Launch revs
    if (t < 5) {
      this.telemetry.speedMph = 0;
      this.telemetry.rpm = 900;
      this.telemetry.gear = 1;
    } else if (t < 15) {
      this.telemetry.speedMph = 0;
      this.telemetry.rpm = 5400 + Math.sin(t * 12) * 400; // Two-step launch rev
      this.telemetry.launchControlArmed = true;
    } else if (t < 30) {
      // Act 2 (15-30s): High speed drift & 5th Avenue tear
      const progress = (t - 15) / 15;
      this.telemetry.speedMph = 90 + progress * 80;
      this.telemetry.gear = Math.min(5, Math.floor(2 + progress * 3));
      this.telemetry.rpm = 7200 + Math.sin(t * 8) * 1200;
      this.telemetry.isDrifting = t >= 22 && t <= 29;
      this.playerCarGroup.position.z = (t - 15) * 20;
    } else if (t < 50) {
      // Act 3 (30-50s): Brooklyn Bridge police pursuit & blizzard
      this.telemetry.speedMph = 185 + Math.sin(t * 3) * 15;
      this.telemetry.gear = 6;
      this.telemetry.rpm = 8400;
      this.telemetry.tcsMode = t >= 38 ? 'OFF' : 'ON';
      this.playerCarGroup.position.z = 120 + (t - 30) * 12;

      // Position police interceptor aggressive alongside
      this.policeCarGroup.position.z = this.playerCarGroup.position.z - 3 + Math.sin(t * 4) * 2;
      this.policeCarGroup.position.x = this.playerCarGroup.position.x - 3.2;
    } else {
      // Act 4 (50-60s): Climax blockade smash & finish line
      this.telemetry.speedMph = 224;
      this.telemetry.gear = 6;
      this.telemetry.rpm = 8900;
      this.telemetry.boostPsi = 28.0;
      this.playerCarGroup.position.z = 350 + (t - 50) * 10;
    }

    soundEngine.setEngineRPM(this.telemetry.rpm);
    this.tachometerNeedle.rotation.z = -(-2.3 + (this.telemetry.rpm / 9000) * 4.6);
  }

  private updateCamera(delta: number) {
    if (this.isCinematicPlaying) {
      this.applyCinematicCameraPreset(this.cinematicPreset, delta);
      return;
    }

    const carPos = this.playerCarGroup.position;

    if (this.cameraMode === 'cockpit') {
      // Driver's eye view inside cabin (-0.38m X, 1.25m Y, 0.05m Z)
      _camPosTarget.set(carPos.x - 0.38, carPos.y + 1.22, carPos.z - 0.05);
      _camLookTarget.set(carPos.x - 0.38 + this.telemetry.steeringAngle * 0.4, carPos.y + 1.15, carPos.z + 15);
      this.camera.position.lerp(_camPosTarget, 0.4);
      this.camera.lookAt(_camLookTarget);
    } else if (this.cameraMode === 'chase') {
      // Forza Horizon style dynamic third-person follow camera
      _camPosTarget.set(carPos.x - this.telemetry.steeringAngle * 1.5, carPos.y + 2.4, carPos.z - 6.2);
      _camLookTarget.set(carPos.x, carPos.y + 1.1, carPos.z + 6);
      this.camera.position.lerp(_camPosTarget, 0.2);
      this.camera.lookAt(_camLookTarget);
    } else if (this.cameraMode === 'hood') {
      _camPosTarget.set(carPos.x, carPos.y + 0.95, carPos.z + 1.2);
      _camLookTarget.set(carPos.x, carPos.y + 0.8, carPos.z + 20);
      this.camera.position.lerp(_camPosTarget, 0.5);
      this.camera.lookAt(_camLookTarget);
    } else if (this.cameraMode === 'cinematic') {
      // Orbit beauty cam
      const time = this.clock.getElapsedTime() * 0.4;
      _camPosTarget.set(carPos.x + Math.sin(time) * 6, carPos.y + 1.8 + Math.cos(time * 0.5) * 0.6, carPos.z + Math.cos(time) * 6);
      this.camera.position.lerp(_camPosTarget, 0.1);
      this.camera.lookAt(carPos.x, carPos.y + 0.8, carPos.z);
    }
  }

  private applyCinematicCameraPreset(preset: string, delta: number) {
    const carPos = this.playerCarGroup.position;

    switch (preset) {
      case 'times_square_macro':
        // Slow-motion exterior macro across front carbon splitter
        this.camera.position.set(carPos.x - 1.8, carPos.y + 0.45, carPos.z + 2.8);
        this.camera.lookAt(carPos.x, carPos.y + 0.5, carPos.z + 1.2);
        break;

      case 'cockpit_gauges':
        // Dramatic interior close-up of steering wheel & gauge sweep
        this.camera.position.set(carPos.x - 0.32, carPos.y + 1.12, carPos.z + 0.15);
        this.camera.lookAt(carPos.x - 0.38, carPos.y + 1.05, carPos.z + 0.7);
        break;

      case 'rival_rev':
        // Side-by-side shot framed from driver side window to JDM rival
        this.camera.position.set(carPos.x + 1.6, carPos.y + 1.2, carPos.z + 0.2);
        this.camera.lookAt(carPos.x + 4.5, carPos.y + 0.9, carPos.z + 0.2);
        break;

      case 'manhattan_drift':
        // Low asphalt chase tracking tire smoke
        this.camera.position.set(carPos.x - 3.2, carPos.y + 0.6, carPos.z - 4.5);
        this.camera.lookAt(carPos.x, carPos.y + 0.7, carPos.z + 4);
        break;

      case 'cockpit_rearview':
        // Interior view focusing on rearview mirror showing rival in dust
        this.camera.position.set(carPos.x, carPos.y + 1.15, carPos.z + 0.05);
        this.camera.lookAt(carPos.x, carPos.y + 1.35, carPos.z + 0.4);
        break;

      case 'brooklyn_sunset':
        // Grand sweeping shot across Brooklyn Bridge suspension cables
        this.camera.position.set(carPos.x - 8, carPos.y + 7.5, carPos.z - 12);
        this.camera.lookAt(carPos.x, carPos.y + 1.5, carPos.z + 10);
        break;

      case 'snow_storm':
        // Close cockpit view with snow whipping against windshield
        this.camera.position.set(carPos.x - 0.38, carPos.y + 1.22, carPos.z - 0.05);
        this.camera.lookAt(carPos.x - 0.38, carPos.y + 1.15, carPos.z + 15);
        break;

      case 'cop_chase':
        // High-speed chase angle dodging squad car
        this.camera.position.set(carPos.x + 2.5, carPos.y + 1.8, carPos.z - 7.5);
        this.camera.lookAt(carPos.x, carPos.y + 1.0, carPos.z + 4.0);
        break;

      case 'blockade_smash':
        // Frontal hero impact shot ahead of car crossing finish line
        this.camera.position.set(carPos.x + 0.5, carPos.y + 0.9, carPos.z + 16);
        this.camera.lookAt(carPos.x, carPos.y + 0.8, carPos.z);
        break;

      case 'title_reveal':
        // Title card blackout
        this.camera.position.set(0, 10, -500);
        this.camera.lookAt(0, 10, 0);
        break;

      default:
        this.camera.position.set(carPos.x - 0.38, carPos.y + 1.22, carPos.z - 0.05);
        this.camera.lookAt(carPos.x - 0.38, carPos.y + 1.15, carPos.z + 15);
    }
  }

  private updateEffects(delta: number) {
    const t = this.clock.getElapsedTime();

    // Alternate Police Strobes (NYPD Red & Blue)
    if (this.isCinematicPlaying && this.cinematicTime >= 30 && this.cinematicTime < 55) {
      const strobe = Math.floor(t * 12) % 2 === 0;
      this.policeLightRed.intensity = strobe ? 8 : 0;
      this.policeLightBlue.intensity = !strobe ? 8 : 0;
      this.policeLightRed.position.set(this.policeCarGroup.position.x - 0.5, 2.2, this.policeCarGroup.position.z);
      this.policeLightBlue.position.set(this.policeCarGroup.position.x + 0.5, 2.2, this.policeCarGroup.position.z);
    } else {
      this.policeLightRed.intensity = 0;
      this.policeLightBlue.intensity = 0;
    }

    // Weather particles fall animation
    if (this.weatherParticles && this.weatherParticles.visible) {
      const positions = this.weatherParticles.geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;
      const carPos = this.playerCarGroup.position;
      const fallSpeed = this.weather === 'manhattan_blizzard' ? 8 : 28;

      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= fallSpeed * delta;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 35 + Math.random() * 10;
          positions[i * 3] = carPos.x + (Math.random() - 0.5) * 60;
          positions[i * 3 + 2] = carPos.z + (Math.random() - 0.5) * 80;
        }
      }
      this.weatherParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  private renderRearviewMirror() {
    // Position rear camera inside player cockpit looking directly backwards
    const carPos = this.playerCarGroup.position;
    this.rearCamera.position.set(carPos.x, carPos.y + 1.35, carPos.z + 0.35);
    this.rearCamera.lookAt(carPos.x, carPos.y + 1.2, carPos.z - 20);

    // Hide cockpit shell momentarily to avoid clipping inside rearview render
    this.renderer.setRenderTarget(this.rearRenderTarget);
    this.renderer.render(this.scene, this.rearCamera);
    this.renderer.setRenderTarget(null);
  }

  public handleResize() {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    this.isDisposed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    soundEngine.stopEngineSound();
    soundEngine.setPoliceSiren(false);
    this.renderer.dispose();
    this.rearRenderTarget.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
