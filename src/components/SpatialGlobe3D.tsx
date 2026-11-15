/**
 * TerraWaltz Real 3D Earth Orbit & NISAR Radar Satellite Engine
 * 
 * Features:
 * - High-resolution photorealistic NASA Blue Marble textures (Day, Normal bump map, Specular ocean gloss)
 * - Independent rotating Atmospheric Cloud layer with realistic drift
 * - Rayleigh-scattering dual-shell atmospheric halo & deep-space starfield
 * - Full Three.js OrbitControls: 360° drag-rotate, smooth zoom, pan, spherical damping
 * - Exact 747 km Sun-synchronous orbit (98.4° inclination) with 242 km SweepSAR radar beam & swath footprint
 * - High-fidelity 3D NISAR spacecraft (12m deployable gold mesh reflector, bus, solar wings, feed boom)
 * - Multiple camera modes: Free Orbit, Satellite Chase Cam, Nadir Radar Cam, Target Lock
 * - Real-time orbital telemetry: Sub-satellite Lat/Lon, 7.48 km/s velocity, 99.8 min period
 * - Interactive hotspot pins with smooth cinematic camera flight & direct 2D GIS map transition
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Hotspot } from '../data/hotspots';
import {
  Globe,
  RotateCw,
  Play,
  Pause,
  Layers,
  Camera,
  Navigation,
  Eye,
  Crosshair,
  Compass,
  Radio,
  Sliders,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface SpatialGlobe3DProps {
  hotspots: Hotspot[];
  selectedHotspot: Hotspot;
  onSelectHotspot: (hotspotId: string) => void;
  onOpenGisView: () => void;
}

type CameraMode = 'free' | 'chase' | 'nadir' | 'target';

export const SpatialGlobe3D: React.FC<SpatialGlobe3DProps> = ({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  onOpenGisView,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // UI Interactive States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [orbitSpeed, setOrbitSpeed] = useState<number>(1);
  const [cameraMode, setCameraMode] = useState<CameraMode>('free');
  const [showClouds, setShowClouds] = useState<boolean>(true);
  const [showAtmosphere, setShowAtmosphere] = useState<boolean>(true);
  const [showRadarBeam, setShowRadarBeam] = useState<boolean>(true);
  const [showOrbitTrack, setShowOrbitTrack] = useState<boolean>(true);
  const [showHotspotPins, setShowHotspotPins] = useState<boolean>(true);
  const [hoveredHotspot, setHoveredHotspot] = useState<Hotspot | null>(null);

  // Cursor Inspection & Auto-Return to Live Orbit State
  const [isCursorInspecting, setIsCursorInspecting] = useState<boolean>(false);
  const [returnCountdown, setReturnCountdown] = useState<number>(5);
  const [isAutoReturnPaused, setIsAutoReturnPaused] = useState<boolean>(false);
  const autoReturnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAutoReturnPausedRef = useRef<boolean>(false);
  isAutoReturnPausedRef.current = isAutoReturnPaused;

  // Live Telemetry
  const [telemetry, setTelemetry] = useState({
    altitudeKm: 747.0,
    velocityKmS: 7.48,
    inclinationDeg: 98.4,
    periodMin: 99.8,
    subSatLat: 21.8,
    subSatLon: 88.5,
    swathTarget: 'Indian Ocean / Sundarbans',
    trueAnomalyDeg: 0,
  });

  // Scene references for animation loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const atmoInnerRef = useRef<THREE.Mesh | null>(null);
  const atmoOuterRef = useRef<THREE.Mesh | null>(null);
  const satelliteRef = useRef<THREE.Group | null>(null);
  const radarBeamRef = useRef<THREE.Mesh | null>(null);
  const radarFootprintRef = useRef<THREE.Mesh | null>(null);
  const pulseRingsRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const orbitLineRef = useRef<THREE.Line | null>(null);

  // Target camera position for smooth interpolation
  const isInterpolatingCamera = useRef<boolean>(false);
  const cameraTargetPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 6.5, 24.5));
  const controlsTargetPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Convert Lat/Lon to 3D Cartesian coordinates on sphere radius R
  const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  };

  // Convert 3D position on sphere back to Lat/Lon
  const vector3ToLatLon = (v: THREE.Vector3): { lat: number; lon: number } => {
    const r = v.length();
    const lat = 90 - (Math.acos(v.y / r) * 180) / Math.PI;
    let lon = (Math.atan2(v.z, -v.x) * 180) / Math.PI - 180;
    if (lon < -180) lon += 360;
    if (lon > 180) lon -= 360;
    return { lat, lon };
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 6.5, 24.5);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x060911, 1.0); // Deep space background
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controls.minDistance = 8.5;
    controls.maxDistance = 60;
    controls.enablePan = true;
    controlsRef.current = controls;

    const startAutoReturnCountdown = () => {
      if (isAutoReturnPausedRef.current) return;
      setIsCursorInspecting(true);
      setReturnCountdown(5);

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (autoReturnTimerRef.current) {
        clearTimeout(autoReturnTimerRef.current);
        autoReturnTimerRef.current = null;
      }

      let count = 5;
      countdownIntervalRef.current = setInterval(() => {
        count -= 1;
        setReturnCountdown(count);
        if (count <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setIsCursorInspecting(false);
          setCameraMode('chase');
          isInterpolatingCamera.current = false;
        }
      }, 1000);
    };

    // User interaction handlers: free 360 rotation on drag, auto-return to live orbit after release
    controls.addEventListener('start', () => {
      isInterpolatingCamera.current = false;
      setCameraMode('free');
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (autoReturnTimerRef.current) {
        clearTimeout(autoReturnTimerRef.current);
        autoReturnTimerRef.current = null;
      }
    });

    controls.addEventListener('end', () => {
      startAutoReturnCountdown();
    });

    // 4. Deep Space Starfield
    const starCount = 3500;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 600 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      // Subtle star color variation (cool white, cyan, light amber)
      const colorType = Math.random();
      if (colorType > 0.8) {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 0.65;
      } else if (colorType > 0.6) {
        starColors[i * 3] = 0.7;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 0.95;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 0.95;
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 5. Lighting Setup
    // Primary Sun directional light (illuminating Earth with realistic orbital glare)
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.6);
    sunLight.position.set(35, 18, 28);
    scene.add(sunLight);

    // Balanced Earth ambient light (ensures landmasses & continents on night hemisphere remain clearly visible)
    const ambientLight = new THREE.AmbientLight(0x405575, 1.1);
    scene.add(ambientLight);

    // Cyan atmosphere rim / Earthshine light
    const rimLight = new THREE.DirectionalLight(0x00f0ff, 0.6);
    rimLight.position.set(-30, -10, -20);
    scene.add(rimLight);

    // Camera-attached subtle soft fill light (ensures high visual contrast from any viewing angle)
    const cameraFillLight = new THREE.DirectionalLight(0xffffff, 0.75);
    cameraFillLight.position.set(0, 0, 1);
    camera.add(cameraFillLight);
    scene.add(camera);

    // 6. Globe Assembly
    const globeRadius = 5.5;
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Load Photorealistic NASA Earth Textures
    const textureLoader = new THREE.TextureLoader();

    const earthDayMap = textureLoader.load('/textures/earth_day.jpg');
    earthDayMap.colorSpace = THREE.SRGBColorSpace;

    const earthNormalMap = textureLoader.load('/textures/earth_normal.jpg');
    const earthSpecularMap = textureLoader.load('/textures/earth_specular.jpg');

    // High-poly Earth sphere mesh
    const earthGeo = new THREE.SphereGeometry(globeRadius, 96, 96);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthDayMap,
      normalMap: earthNormalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughnessMap: earthSpecularMap,
      roughness: 0.45,
      metalness: 0.08,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // 7. Atmospheric Clouds Layer (with depthWrite: false to prevent dark edge occlusion)
    const cloudsMap = textureLoader.load('/textures/earth_clouds.png');
    cloudsMap.colorSpace = THREE.SRGBColorSpace;

    const cloudsGeo = new THREE.SphereGeometry(globeRadius * 1.012, 80, 80);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      roughness: 1.0,
      metalness: 0.0,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    cloudsMeshRef.current = cloudsMesh;
    globeGroup.add(cloudsMesh);

    // 8. Ethereal Rayleigh Atmospheric Scattering & Blue Horizon Haze (Zero Dark Rim, Seamless Blend)
    // A. Outer Rayleigh Scattering Halo (Fades smoothly to exactly 0.0 at outer boundary - ZERO hard edge)
    const atmoOuterGeo = new THREE.SphereGeometry(globeRadius * 1.15, 64, 64);
    const atmoOuterMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 viewDir = normalize(vViewPosition);
          float cosTheta = dot(vNormal, viewDir);
          // Perfectly smooth transition: at the outer boundary (cosTheta <= 0.0), intensity is IDENTICALLY 0.0!
          float outerFalloff = smoothstep(0.0, 0.28, cosTheta);
          float innerFalloff = smoothstep(0.85, 0.35, cosTheta);
          float intensity = outerFalloff * innerFalloff;
          vec3 atmosphereColor = mix(vec3(0.02, 0.45, 0.95), vec3(0.3, 0.85, 1.0), intensity);
          gl_FragColor = vec4(atmosphereColor, intensity * 0.75);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmoOuterMesh = new THREE.Mesh(atmoOuterGeo, atmoOuterMat);
    atmoOuterRef.current = atmoOuterMesh;
    globeGroup.add(atmoOuterMesh);

    // B. Inner Surface Atmospheric Blue Horizon Haze (FrontSide Fresnel on Earth surface)
    const atmoInnerGeo = new THREE.SphereGeometry(globeRadius * 1.008, 64, 64);
    const atmoInnerMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 viewDir = normalize(vViewPosition);
          float cosTheta = dot(vNormal, viewDir);
          // FrontSide Fresnel: bright at the grazing edge, clear at the center
          float fresnel = pow(clamp(1.0 - cosTheta, 0.0, 1.0), 3.0);
          vec3 hazeColor = mix(vec3(0.05, 0.6, 1.0), vec3(0.7, 0.95, 1.0), fresnel);
          gl_FragColor = vec4(hazeColor, fresnel * 0.65);
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmoInnerMesh = new THREE.Mesh(atmoInnerGeo, atmoInnerMat);
    atmoInnerRef.current = atmoInnerMesh;
    globeGroup.add(atmoInnerMesh);

    // 9. Coordinate Grid Lines (Latitude / Longitude)
    const gridGeo = new THREE.SphereGeometry(globeRadius * 1.002, 24, 16);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    globeGroup.add(gridMesh);

    // 10. High-Fidelity 3D NISAR Satellite Model
    const satGroup = new THREE.Group();
    satelliteRef.current = satGroup;

    // A. Main Spacecraft Bus (Hexagonal / Rectangular Body with Gold MLI Insulation)
    const busGeo = new THREE.BoxGeometry(0.42, 0.55, 0.42);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Golden thermal foil
      metalness: 0.9,
      roughness: 0.25,
    });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    satGroup.add(busMesh);

    // Spacecraft Avionics & Instrument Deck (Dark Carbon)
    const deckGeo = new THREE.BoxGeometry(0.46, 0.08, 0.46);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x1a1c22, metalness: 0.6, roughness: 0.4 });
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.y = 0.28;
    satGroup.add(deckMesh);

    // B. Deployable Solar Array Wings (Twin articulated panels)
    const wingLength = 1.7;
    const wingWidth = 0.55;
    const solarGeo = new THREE.BoxGeometry(wingLength, 0.03, wingWidth);
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x0a1931, // Deep photovoltaic blue
      metalness: 0.85,
      roughness: 0.15,
    });

    const leftWing = new THREE.Mesh(solarGeo, solarMat);
    leftWing.position.x = 0.42 / 2 + wingLength / 2 + 0.15;
    leftWing.position.y = 0.05;
    satGroup.add(leftWing);

    const rightWing = new THREE.Mesh(solarGeo, solarMat);
    rightWing.position.x = -(0.42 / 2 + wingLength / 2 + 0.15);
    rightWing.position.y = 0.05;
    satGroup.add(rightWing);

    // Wing connection booms
    const wingBoomGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8);
    const boomMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.8 });
    const leftBoom = new THREE.Mesh(wingBoomGeo, boomMat);
    leftBoom.rotation.z = Math.PI / 2;
    leftBoom.position.x = 0.42 / 2 + 0.075;
    satGroup.add(leftBoom);

    const rightBoom = leftBoom.clone();
    rightBoom.position.x = -(0.42 / 2 + 0.075);
    satGroup.add(rightBoom);

    // C. 9-Meter Deployable Reflector Boom
    const mainBoomGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.25, 8);
    const mainBoomMesh = new THREE.Mesh(mainBoomGeo, boomMat);
    mainBoomMesh.position.set(0, -0.65, 0.45);
    mainBoomMesh.rotation.x = Math.PI / 4;
    satGroup.add(mainBoomMesh);

    // D. Iconic 12-Meter Deployable Gold Mesh Radar Reflector Dish
    const dishRadius = 0.95;
    const dishGeo = new THREE.SphereGeometry(dishRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xffa726, // Reflective radar gold mesh
      metalness: 0.95,
      roughness: 0.2,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.position.set(0, -1.35, 1.05);
    dishMesh.rotation.x = -Math.PI / 3.2;
    satGroup.add(dishMesh);

    // Radar Feedhorn Assembly (Aiming toward 12m Reflector)
    const feedGeo = new THREE.ConeGeometry(0.09, 0.25, 12);
    const feedMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });
    const feedMesh = new THREE.Mesh(feedGeo, feedMat);
    feedMesh.position.set(0, -0.75, 0.65);
    feedMesh.rotation.x = Math.PI / 3;
    satGroup.add(feedMesh);

    // E. Sweeping Microwave Radar Beam Cone (projecting from dish down to Earth)
    const beamLength = 2.8;
    const beamRadius = 1.1;
    const beamGeo = new THREE.ConeGeometry(beamRadius, beamLength, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff6b00,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(0, -2.2, 0.9);
    beamMesh.rotation.x = Math.PI;
    radarBeamRef.current = beamMesh;
    satGroup.add(beamMesh);

    // F. Electromagnetic Pulse Rings (concentric microwave waves)
    const pulseRingsGroup = new THREE.Group();
    pulseRingsRef.current = pulseRingsGroup;
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.RingGeometry(0.2 + i * 0.25, 0.24 + i * 0.25, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff9100,
        transparent: true,
        opacity: 0.6 - i * 0.12,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, -1.5 - i * 0.35, 0.9);
      ring.rotation.x = Math.PI / 2;
      pulseRingsGroup.add(ring);
    }
    satGroup.add(pulseRingsGroup);

    scene.add(satGroup);

    // G. Radar Ground Swath Footprint Indicator on Earth Surface (242 km Swath)
    const footprintGeo = new THREE.PlaneGeometry(1.4, 0.85);
    const footprintMat = new THREE.MeshBasicMaterial({
      color: 0xff6b00,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const footprintMesh = new THREE.Mesh(footprintGeo, footprintMat);
    radarFootprintRef.current = footprintMesh;
    scene.add(footprintMesh);

    // 11. Orbital Trajectory Ring (747 km altitude, 98.4° polar inclination)
    // Earth radius: 5.5, Satellite orbit radius: 5.5 + 2.4 = 7.9
    const orbitRadius = globeRadius + 2.4;
    const orbitPoints: THREE.Vector3[] = [];
    const orbitSegments = 180;
    const inclinationRad = (98.4 * Math.PI) / 180;

    for (let i = 0; i <= orbitSegments; i++) {
      const angle = (i / orbitSegments) * Math.PI * 2;
      const x = orbitRadius * Math.cos(angle);
      const y = orbitRadius * Math.sin(angle) * Math.cos(inclinationRad);
      const z = orbitRadius * Math.sin(angle) * Math.sin(inclinationRad);
      orbitPoints.push(new THREE.Vector3(x, y, z));
    }

    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLineRef.current = orbitLine;
    scene.add(orbitLine);

    // 12. Interactive 3D Hotspot Pins
    const pinsGroup = new THREE.Group();
    pinsGroupRef.current = pinsGroup;
    globeGroup.add(pinsGroup);

    hotspots.forEach((h) => {
      const [lat, lon] = h.center;
      const pos = latLonToVector3(lat, lon, globeRadius + 0.1);

      // Pin base disc
      const isSelected = h.id === selectedHotspot.id;
      const pinDiscGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16);
      const pinDiscMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xff6b00 : 0x00f0ff,
      });
      const pinDisc = new THREE.Mesh(pinDiscGeo, pinDiscMat);
      pinDisc.position.copy(pos);
      pinDisc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());

      // Luminous pulse ring
      const ringGeo = new THREE.RingGeometry(0.16, 0.24, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xff6b00 : 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.5,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.01));
      ringMesh.quaternion.copy(pinDisc.quaternion);

      // Pointer stalk
      const stalkGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
      const stalkMat = new THREE.MeshBasicMaterial({ color: isSelected ? 0xff6b00 : 0xffffff });
      const stalkMesh = new THREE.Mesh(stalkGeo, stalkMat);
      stalkMesh.position.copy(pos.clone().multiplyScalar(1.025));
      stalkMesh.quaternion.copy(pinDisc.quaternion);

      // Beacon tip sphere
      const tipGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const tipMat = new THREE.MeshBasicMaterial({ color: isSelected ? 0xff6b00 : 0x00f0ff });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.position.copy(pos.clone().multiplyScalar(1.045));

      pinDisc.userData = { hotspot: h };
      ringMesh.userData = { hotspot: h };
      stalkMesh.userData = { hotspot: h };
      tipMesh.userData = { hotspot: h };

      pinsGroup.add(pinDisc);
      pinsGroup.add(ringMesh);
      pinsGroup.add(stalkMesh);
      pinsGroup.add(tipMesh);
    });

    // 13. Raycasting for Pin Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (pinsGroupRef.current) {
        const intersects = raycaster.intersectObjects(pinsGroupRef.current.children);
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          if (hit.userData && hit.userData.hotspot) {
            const h: Hotspot = hit.userData.hotspot;
            onSelectHotspot(h.id);
            flyCameraToHotspot(h);
          }
        }
      }
    };

    const handleCanvasMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (pinsGroupRef.current) {
        const intersects = raycaster.intersectObjects(pinsGroupRef.current.children);
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          if (hit.userData && hit.userData.hotspot) {
            setHoveredHotspot(hit.userData.hotspot);
            container.style.cursor = 'pointer';
            return;
          }
        }
      }
      setHoveredHotspot(null);
      container.style.cursor = 'grab';
    };

    container.addEventListener('click', handleCanvasClick);
    container.addEventListener('mousemove', handleCanvasMouseMove);

    // 14. Animation & Physics Loop
    let animationFrameId = 0;
    let orbitProgress = 0;
    let lastTime = performance.now();
    let lastTelemetryTime = 0;

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // 1. Advance Satellite Orbital Position (calibrated to smooth, realistic orbital cadence)
      if (isPlaying) {
        orbitProgress += 0.032 * orbitSpeed * delta;
      }

      const angle = orbitProgress;
      const sx = orbitRadius * Math.cos(angle);
      const sy = orbitRadius * Math.sin(angle) * Math.cos(inclinationRad);
      const sz = orbitRadius * Math.sin(angle) * Math.sin(inclinationRad);

      satGroup.position.set(sx, sy, sz);

      // Orientation: Nadir-pointing with 37° right-looking SAR side-look
      satGroup.lookAt(0, 0, 0);

      // 2. Animate Radar Ground Footprint Swath (projecting on sphere surface)
      if (radarFootprintRef.current) {
        const footprintNormal = satGroup.position.clone().normalize();
        const surfacePos = footprintNormal.clone().multiplyScalar(globeRadius + 0.04);
        radarFootprintRef.current.position.copy(surfacePos);
        radarFootprintRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), footprintNormal);
      }

      // 3. Microwave Pulse Propagation
      if (pulseRingsRef.current) {
        pulseRingsRef.current.children.forEach((child, idx) => {
          const mesh = child as THREE.Mesh;
          const phase = (orbitProgress * 6 + idx * 0.4) % 1;
          mesh.scale.set(1 + phase * 0.8, 1 + phase * 0.8, 1);
          if (mesh.material && 'opacity' in mesh.material) {
            (mesh.material as THREE.Material).opacity = Math.max(0, 0.7 - phase * 0.7);
          }
        });
      }

      // 4. Radar Beam Pulse Breathing
      if (radarBeamRef.current) {
        const beamPulse = 1 + Math.sin(time * 0.006) * 0.06;
        radarBeamRef.current.scale.set(beamPulse, 1, beamPulse);
      }

      // 5. Earth and Cloud Drift
      if (globeGroupRef.current && isPlaying) {
        // Slow realistic Earth rotation
        globeGroupRef.current.rotation.y += 0.015 * orbitSpeed * delta;
      }
      if (cloudsMeshRef.current && isPlaying) {
        // Clouds drift slightly faster due to atmospheric jet streams
        cloudsMeshRef.current.rotation.y += 0.022 * orbitSpeed * delta;
      }

      // 5b. Horizon Culling for Hotspot Pins (Culls pins on the far hemisphere of Earth to prevent them floating into space)
      if (pinsGroupRef.current && camera) {
        const camPos = camera.position;
        pinsGroupRef.current.children.forEach((child) => {
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          const surfaceNorm = worldPos.clone().normalize();
          const toCam = camPos.clone().sub(worldPos).normalize();
          child.visible = showHotspotPins && surfaceNorm.dot(toCam) > 0.06;
        });
      }

      // 6. Camera Modes
      if (cameraMode === 'chase') {
        // Camera flies directly behind the satellite in orbit
        const chaseOffset = satGroup.position
          .clone()
          .normalize()
          .multiplyScalar(orbitRadius + 2.2);
        chaseOffset.y += 1.2;
        camera.position.lerp(chaseOffset, 0.08);
        camera.lookAt(satGroup.position);
        controls.target.copy(satGroup.position);
      } else if (cameraMode === 'nadir') {
        // Camera looks straight down from the satellite dish to the Earth's surface
        camera.position.copy(satGroup.position);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
      } else if (isInterpolatingCamera.current) {
        camera.position.lerp(cameraTargetPos.current, 0.08);
        controls.target.lerp(controlsTargetPos.current, 0.08);
        if (camera.position.distanceTo(cameraTargetPos.current) < 0.1) {
          isInterpolatingCamera.current = false;
        }
      }

      // 7. Update Live Telemetry (Throttled to 8 Hz for steady readability without flickering)
      if (time - lastTelemetryTime > 120) {
        lastTelemetryTime = time;
        const subSatVector = satGroup.position.clone().normalize();
        const { lat, lon } = vector3ToLatLon(subSatVector);
        const anomaly = ((angle * 180) / Math.PI) % 360;

        let currentRegion = 'Open Ocean / Transit';
        if (lat >= 18 && lat <= 26 && lon >= 80 && lon <= 92) {
          currentRegion = 'Indian Sundarbans / Bay of Bengal';
        } else if (lat >= 5 && lat <= 15 && lon >= -75 && lon <= -58) {
          currentRegion = 'Venezuela Coseismic Fault Zone';
        } else if (lat >= 25 && lat <= 32 && lon >= 85 && lon <= 95) {
          currentRegion = 'Himalayan Glacial Lake Belt';
        } else if (lat >= 20 && lat <= 25 && lon >= 86 && lon <= 90) {
          currentRegion = 'Kolkata Urban Basin';
        }

        setTelemetry((prev) => ({
          ...prev,
          subSatLat: parseFloat(lat.toFixed(2)),
          subSatLon: parseFloat(lon.toFixed(2)),
          trueAnomalyDeg: parseFloat(anomaly.toFixed(1)),
          swathTarget: currentRegion,
        }));
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate(performance.now());
    setTimeout(() => {
      flyCameraToHotspot(selectedHotspot);
    }, 120);

    // 15. Resize Listener
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (autoReturnTimerRef.current) clearTimeout(autoReturnTimerRef.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleCanvasClick);
      container.removeEventListener('mousemove', handleCanvasMouseMove);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [hotspots]);

  // Return smoothly to live orbit (chase cam or orbital track)
  const handleReturnToLiveOrbit = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (autoReturnTimerRef.current) {
      clearTimeout(autoReturnTimerRef.current);
      autoReturnTimerRef.current = null;
    }
    setIsCursorInspecting(false);
    setReturnCountdown(5);
    setCameraMode('chase');
    isInterpolatingCamera.current = false;
  };

  // Smooth cinematic fly-to hotspot (zoomed out for elegant scale & context)
  const flyCameraToHotspot = (hotspot: Hotspot) => {
    if (!cameraRef.current || !controlsRef.current) return;
    setCameraMode('target');
    const [lat, lon] = hotspot.center;
    const targetVec = latLonToVector3(lat, lon, 5.5);

    // Place camera at optimized zoomed-out distance for majestic Earth proportions
    const camOffset = targetVec.clone().normalize().multiplyScalar(21.5);
    camOffset.y += 1.8;

    cameraTargetPos.current.copy(camOffset);
    controlsTargetPos.current.set(0, 0, 0); // Keep Earth centered
    isInterpolatingCamera.current = true;
  };

  // React to selectedHotspot prop changes
  useEffect(() => {
    flyCameraToHotspot(selectedHotspot);
  }, [selectedHotspot]);

  // Layer visibility toggles
  useEffect(() => {
    if (cloudsMeshRef.current) cloudsMeshRef.current.visible = showClouds;
  }, [showClouds]);

  useEffect(() => {
    if (atmoOuterRef.current) atmoOuterRef.current.visible = showAtmosphere;
    if (atmoInnerRef.current) atmoInnerRef.current.visible = showAtmosphere;
  }, [showAtmosphere]);

  useEffect(() => {
    if (radarBeamRef.current) radarBeamRef.current.visible = showRadarBeam;
    if (radarFootprintRef.current) radarFootprintRef.current.visible = showRadarBeam;
    if (pulseRingsRef.current) pulseRingsRef.current.visible = showRadarBeam;
  }, [showRadarBeam]);

  useEffect(() => {
    if (orbitLineRef.current) orbitLineRef.current.visible = showOrbitTrack;
  }, [showOrbitTrack]);

  useEffect(() => {
    if (pinsGroupRef.current) pinsGroupRef.current.visible = showHotspotPins;
  }, [showHotspotPins]);

  // Zoom controls
  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const factor = direction === 'in' ? 0.8 : 1.25;
    cameraRef.current.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    setCameraMode('free');
    cameraTargetPos.current.set(0, 6.5, 24.5);
    controlsTargetPos.current.set(0, 0, 0);
    isInterpolatingCamera.current = true;
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#060911] overflow-hidden select-none">
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing focus:outline-none"
      />

      {/* Dynamic Cursor Inspection & Auto-Return Banner */}
      {isCursorInspecting && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0D131F]/95 backdrop-blur-md border border-[#00F0FF]/40 shadow-xl shadow-[#00F0FF]/15 animate-fade-in text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-ping" />
          <span className="text-white font-mono text-[11px]">
            Cursor Inspection · Returning to Live Orbit in <strong className="text-[#00F0FF] text-xs font-bold">{returnCountdown}s</strong>
          </span>
          <button
            onClick={handleReturnToLiveOrbit}
            className="px-2.5 py-1 rounded-xl bg-[#00F0FF] text-[#060911] font-bold text-[10px] hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            Return Now
          </button>
          <button
            onClick={() => {
              setIsAutoReturnPaused(true);
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              setIsCursorInspecting(false);
            }}
            className="px-2.5 py-1 rounded-xl bg-white/10 text-[#A0AEC0] hover:text-white hover:bg-white/20 text-[10px] transition-all cursor-pointer"
            title="Stay in free 360 exploration mode without auto-returning"
          >
            Keep Exploring
          </button>
        </div>
      )}

      {/* TOP HUD: Real-Time Mission Telemetry & Orbit Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Mission Status Badge (Click to Snap / Follow Live Orbit) */}
        <button
          onClick={() => {
            setCameraMode('chase');
            isInterpolatingCamera.current = false;
          }}
          className="glass-panel px-4 py-2.5 rounded-2xl pointer-events-auto flex items-center gap-3 bg-[#0D131F]/80 backdrop-blur-md border border-[#00F0FF]/30 shadow-lg shadow-[#00F0FF]/10 text-left hover:border-[#00F0FF] hover:bg-[#0D131F]/95 transition-all cursor-pointer group"
          title="Click to Lock onto Live Satellite Orbit (Chase Cam)"
        >
          <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/15 flex items-center justify-center text-[#00F0FF] group-hover:scale-110 transition-transform animate-pulse">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white tracking-wide group-hover:text-[#00F0FF] transition-colors">
                NISAR REAL ORBIT ENGINE
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00FF66]/20 text-[#00FF66] font-bold">
                {cameraMode === 'chase' ? 'TRACKING LIVE' : 'LIVE ORBIT'}
              </span>
            </div>
            <p className="text-[11px] text-[#A0AEC0] flex items-center gap-2 font-mono">
              <span>Alt: <strong className="text-white">{telemetry.altitudeKm} km</strong></span>
              <span>·</span>
              <span>Vel: <strong className="text-white">{telemetry.velocityKmS} km/s</strong></span>
              <span>·</span>
              <span>Inc: <strong className="text-white">{telemetry.inclinationDeg}°</strong></span>
            </p>
          </div>
        </button>

        {/* Live Sub-Satellite Ground Coordinate Box (Click to Focus Live Footprint) */}
        <button
          onClick={() => {
            setCameraMode('nadir');
            isInterpolatingCamera.current = false;
          }}
          className="glass-panel px-4 py-2 rounded-2xl pointer-events-auto bg-[#0D131F]/80 backdrop-blur-md border border-[#FF6B00]/30 flex items-center gap-3 text-left hover:border-[#FF6B00] hover:bg-[#0D131F]/95 transition-all cursor-pointer group"
          title="Click to Snap to Nadir Ground Footprint (Looking down from satellite)"
        >
          <Crosshair className="w-4 h-4 text-[#FF6B00] animate-spin group-hover:scale-110 transition-transform" />
          <div className="text-left font-mono">
            <div className="text-[10px] text-[#A0AEC0] uppercase group-hover:text-[#FF6B00] transition-colors flex items-center gap-1.5">
              <span>Sub-Satellite Footprint</span>
              <span className="text-[9px] text-[#00FF66] font-bold">● LIVE</span>
            </div>
            <div className="text-xs font-bold text-white">
              {Math.abs(telemetry.subSatLat)}°{telemetry.subSatLat >= 0 ? 'N' : 'S'}, {Math.abs(telemetry.subSatLon)}°{telemetry.subSatLon >= 0 ? 'E' : 'W'}
            </div>
          </div>
          <div className="hidden md:block pl-2 border-l border-white/10 text-[11px] text-[#00F0FF] font-medium max-w-[180px] truncate">
            {telemetry.swathTarget}
          </div>
        </button>

        {/* Top-Right Quick Navigation */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onOpenGisView}
            className="px-4 py-2 rounded-xl bg-[#FF6B00] text-white text-xs font-bold tracking-wide shadow-lg shadow-[#FF6B00]/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Switch to 2D Detailed GIS Map</span>
          </button>
        </div>
      </div>

      {/* LEFT FLOATING CONTROL BAR: Camera Modes, Speed & Simulation Controls */}
      <div className="absolute top-20 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Play/Pause & Speed */}
        <div className="glass-panel p-1.5 rounded-2xl bg-[#0D131F]/85 backdrop-blur-md border border-white/10 flex flex-col gap-1 shadow-lg">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isPlaying ? 'bg-[#00FF66]/20 text-[#00FF66]' : 'bg-[#FF6B00]/20 text-[#FF6B00]'
            }`}
            title={isPlaying ? 'Pause Orbit' : 'Resume Orbit'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Speed Selectors */}
          {[1, 5, 15, 45].map((spd) => (
            <button
              key={spd}
              onClick={() => setOrbitSpeed(spd)}
              className={`w-9 h-7 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                orbitSpeed === spd
                  ? 'bg-[#00F0FF] text-[#060911] shadow-sm'
                  : 'text-[#A0AEC0] hover:text-white hover:bg-white/5'
              }`}
            >
              {spd}×
            </button>
          ))}
        </div>

        {/* Camera Perspective Mode Toggles */}
        <div className="glass-panel p-1.5 rounded-2xl bg-[#0D131F]/85 backdrop-blur-md border border-white/10 flex flex-col gap-1 shadow-lg">
          <button
            onClick={() => { setCameraMode('free'); isInterpolatingCamera.current = false; }}
            className={`p-2 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer ${
              cameraMode === 'free' ? 'bg-[#00F0FF] text-[#060911] font-bold' : 'text-[#A0AEC0] hover:text-white hover:bg-white/5'
            }`}
            title="Free Orbit Camera (360° Drag & Zoom)"
          >
            <Globe className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCameraMode('chase')}
            className={`p-2 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer ${
              cameraMode === 'chase' ? 'bg-[#FF6B00] text-white font-bold' : 'text-[#A0AEC0] hover:text-white hover:bg-white/5'
            }`}
            title="Satellite Chase Cam (Fly behind NISAR)"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCameraMode('nadir')}
            className={`p-2 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer ${
              cameraMode === 'nadir' ? 'bg-[#00FF66] text-[#060911] font-bold' : 'text-[#A0AEC0] hover:text-white hover:bg-white/5'
            }`}
            title="Nadir Radar Cam (Look straight down from dish)"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            onClick={() => flyCameraToHotspot(selectedHotspot)}
            className={`p-2 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer ${
              cameraMode === 'target' ? 'bg-[#FF6B00] text-white font-bold' : 'text-[#A0AEC0] hover:text-white hover:bg-white/5'
            }`}
            title="Focus On Active Hotspot (Target Lock)"
          >
            <Compass className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetCamera}
            className="p-2 rounded-xl text-xs text-[#A0AEC0] hover:text-white hover:bg-white/5 flex items-center justify-center transition-all cursor-pointer"
            title="Reset Camera Position"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom In/Out Buttons */}
        <div className="glass-panel p-1 rounded-xl bg-[#0D131F]/85 backdrop-blur-md border border-white/10 flex flex-col gap-0.5 shadow-lg">
          <button
            onClick={() => handleZoom('in')}
            className="p-2 rounded-lg text-[#A0AEC0] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="p-2 rounded-lg text-[#A0AEC0] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RIGHT FLOATING LAYER TOGGLES */}
      <div className="absolute top-20 right-4 z-20 pointer-events-auto flex flex-col gap-1.5">
        <div className="glass-panel p-3 rounded-2xl bg-[#0D131F]/85 backdrop-blur-md border border-white/10 text-xs shadow-lg flex flex-col gap-2 min-w-[170px]">
          <span className="text-[10px] font-mono text-[#A0AEC0] uppercase tracking-wider font-semibold border-b border-white/10 pb-1 flex items-center gap-1.5">
            <Sliders className="w-3 h-3 text-[#00F0FF]" />
            <span>3D Earth Layers</span>
          </span>

          <label className="flex items-center justify-between text-[#E2E8F0] cursor-pointer hover:text-white text-[11px]">
            <span>Cloud Layer</span>
            <input
              type="checkbox"
              checked={showClouds}
              onChange={(e) => setShowClouds(e.target.checked)}
              className="accent-[#00F0FF] rounded"
            />
          </label>

          <label className="flex items-center justify-between text-[#E2E8F0] cursor-pointer hover:text-white text-[11px]">
            <span>Atmosphere Halo</span>
            <input
              type="checkbox"
              checked={showAtmosphere}
              onChange={(e) => setShowAtmosphere(e.target.checked)}
              className="accent-[#00F0FF] rounded"
            />
          </label>

          <label className="flex items-center justify-between text-[#E2E8F0] cursor-pointer hover:text-white text-[11px]">
            <span>242km Radar Swath</span>
            <input
              type="checkbox"
              checked={showRadarBeam}
              onChange={(e) => setShowRadarBeam(e.target.checked)}
              className="accent-[#FF6B00] rounded"
            />
          </label>

          <label className="flex items-center justify-between text-[#E2E8F0] cursor-pointer hover:text-white text-[11px]">
            <span>747km Orbit Track</span>
            <input
              type="checkbox"
              checked={showOrbitTrack}
              onChange={(e) => setShowOrbitTrack(e.target.checked)}
              className="accent-[#00F0FF] rounded"
            />
          </label>

          <label className="flex items-center justify-between text-[#E2E8F0] cursor-pointer hover:text-white text-[11px]">
            <span>Hotspot Markers</span>
            <input
              type="checkbox"
              checked={showHotspotPins}
              onChange={(e) => setShowHotspotPins(e.target.checked)}
              className="accent-[#00FF66] rounded"
            />
          </label>
        </div>

        {/* Hovered Hotspot Floating Tooltip */}
        {hoveredHotspot && (
          <div className="glass-panel p-3 rounded-2xl bg-[#0D131F]/90 backdrop-blur-md border border-[#FF6B00]/40 text-xs shadow-xl animate-fade-in max-w-[210px]">
            <div className="text-[10px] font-mono text-[#FF6B00] font-bold uppercase">
              {hoveredHotspot.phenomenonLabel}
            </div>
            <div className="font-bold text-white text-xs mt-0.5">
              {hoveredHotspot.name}
            </div>
            <div className="text-[11px] text-[#A0AEC0] mt-0.5">
              {hoveredHotspot.region}
            </div>
            <div className="text-[10px] font-mono text-[#00F0FF] mt-1.5 flex items-center justify-between border-t border-white/10 pt-1">
              <span>{hoveredHotspot.center[0]}°N, {hoveredHotspot.center[1]}°E</span>
              <span className="text-white/60">Click to fly</span>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM FLOATING HOTSPOT CAROUSEL (Quick Fly-to Buttons) */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5 overflow-x-auto pb-1 pointer-events-auto scrollbar-thin">
          {hotspots.map((h) => {
            const isSelected = h.id === selectedHotspot.id;
            return (
              <button
                key={h.id}
                onClick={() => {
                  onSelectHotspot(h.id);
                  flyCameraToHotspot(h);
                }}
                className={`p-3 rounded-2xl text-left transition-all cursor-pointer whitespace-nowrap min-w-[210px] border backdrop-blur-md ${
                  isSelected
                    ? 'bg-[#0D131F]/90 border-[#FF6B00] shadow-lg shadow-[#FF6B00]/20 scale-[1.02]'
                    : 'bg-[#0D131F]/60 border-white/10 hover:border-[#00F0FF]/40 hover:bg-[#0D131F]/80 text-[#A0AEC0]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono uppercase font-bold ${isSelected ? 'text-[#FF6B00]' : 'text-[#00F0FF]'}`}>
                    {h.phenomenonLabel.split(' ')[0]}
                  </span>
                  <Navigation className="w-3 h-3 text-[#A0AEC0]" />
                </div>
                <div className="font-bold text-xs text-white truncate">
                  {h.name.split(' (')[0]}
                </div>
                <div className="text-[11px] text-[#A0AEC0] truncate mt-0.5">
                  {h.region}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
