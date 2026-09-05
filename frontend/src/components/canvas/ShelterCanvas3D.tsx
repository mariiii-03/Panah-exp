import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, ZoomIn, ZoomOut, Box, Eye } from 'lucide-react';

interface ShelterCanvasProps {
  span: number;       // meters (e.g. 5.0)
  height: number;     // wall height meters (e.g. 2.4)
  length: number;     // shelter length meters (e.g. 6.0)
  pitch: number;      // roof pitch degrees (e.g. 22)
  material: string;   // 'treated_bamboo' | 'reclaimed_timber' | 'corrugated_tin'
}

export const ShelterCanvas3D: React.FC<ShelterCanvasProps> = ({
  span,
  height,
  length,
  pitch,
  material,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [zoomLevel, setZoomLevel] = useState(100);

  // References to keep Three.js state across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.35, y: -0.65 });

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const heightPx = container.clientHeight || 600;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#efece1'); // Panah beige canvas tone
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    camera.position.set(8, 6, 10);
    camera.lookAt(0, 1.8, 0);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, heightPx);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 0.85);
    dirLight.position.set(10, 15, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 5. Ground Grid
    const grid = new THREE.GridHelper(20, 20, 0x16232b, 0xd8dccb);
    grid.position.y = 0;
    scene.add(grid);

    // 6. Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (modelGroupRef.current) {
        if (viewMode === '3d') {
          modelGroupRef.current.rotation.y = rotationRef.current.y;
          modelGroupRef.current.rotation.x = rotationRef.current.x;
        } else {
          // Pure front 2D elevation
          modelGroupRef.current.rotation.set(0, 0, 0);
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    // Mouse Drag Controls
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || viewMode !== '3d') return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      rotationRef.current.y += deltaX * 0.008;
      rotationRef.current.x = Math.max(-0.2, Math.min(1.2, rotationRef.current.x + deltaY * 0.008));

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomDelta = e.deltaY * 0.01;
      const newPos = cameraRef.current.position.clone().multiplyScalar(1 + zoomDelta);
      if (newPos.length() > 4 && newPos.length() < 28) {
        cameraRef.current.position.copy(newPos);
        setZoomLevel(Math.round((14 / newPos.length()) * 100));
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 600;
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height || 600;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [viewMode]);

  // Rebuild 3D shelter geometry whenever parametric values change
  useEffect(() => {
    if (!modelGroupRef.current) return;
    const group = modelGroupRef.current;

    // Clear old children
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    // Material Colors
    let frameColor = 0x8a5a36; // Timber default
    if (material === 'treated_bamboo') frameColor = 0xbda062;
    if (material === 'steel_connector') frameColor = 0x546e7a;

    const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.6 });
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0xc8bba9, roughness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x90a4ae,
      roughness: 0.3,
      metalness: 0.6,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });

    const halfSpan = span / 2;
    const halfLength = length / 2;
    const roofHeight = halfSpan * Math.tan((pitch * Math.PI) / 180);
    const postRadius = 0.07;
    const memberRadius = 0.05;

    // Helper: Create a cylinder beam between two 3D points
    const addCylinderBeam = (p1: THREE.Vector3, p2: THREE.Vector3, radius: number, mat: THREE.Material) => {
      const distance = p1.distanceTo(p2);
      const geom = new THREE.CylinderGeometry(radius, radius, distance, 12);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;

      // Position halfway
      mesh.position.copy(p1).add(p2).multiplyScalar(0.5);

      // Orientation
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      mesh.quaternion.setFromUnitVectors(up, dir);
      group.add(mesh);
    };

    // 1. Plinth Foundation Slab
    const plinthGeom = new THREE.BoxGeometry(span + 0.5, 0.3, length + 0.5);
    const plinth = new THREE.Mesh(plinthGeom, plinthMat);
    plinth.position.set(0, 0.15, 0);
    plinth.receiveShadow = true;
    group.add(plinth);

    // 2. Corner & Mid Columns
    const zOffsets = [-halfLength, 0, halfLength];
    zOffsets.forEach((z) => {
      // Left Column
      addCylinderBeam(
        new THREE.Vector3(-halfSpan, 0.3, z),
        new THREE.Vector3(-halfSpan, height, z),
        postRadius,
        frameMat
      );
      // Right Column
      addCylinderBeam(
        new THREE.Vector3(halfSpan, 0.3, z),
        new THREE.Vector3(halfSpan, height, z),
        postRadius,
        frameMat
      );
    });

    // 3. Eaves Beams (Tie along length)
    addCylinderBeam(
      new THREE.Vector3(-halfSpan, height, -halfLength),
      new THREE.Vector3(-halfSpan, height, halfLength),
      memberRadius,
      frameMat
    );
    addCylinderBeam(
      new THREE.Vector3(halfSpan, height, -halfLength),
      new THREE.Vector3(halfSpan, height, halfLength),
      memberRadius,
      frameMat
    );

    // 4. Roof Trusses (Front, Middle, Back)
    zOffsets.forEach((z) => {
      const pLeft = new THREE.Vector3(-halfSpan, height, z);
      const pRight = new THREE.Vector3(halfSpan, height, z);
      const pCenter = new THREE.Vector3(0, height, z);
      const pPeak = new THREE.Vector3(0, height + roofHeight, z);

      // Bottom Chord (Tie Beam)
      addCylinderBeam(pLeft, pRight, memberRadius, frameMat);

      // Left Rafter
      addCylinderBeam(pLeft, pPeak, memberRadius, frameMat);

      // Right Rafter
      addCylinderBeam(pRight, pPeak, memberRadius, frameMat);

      // King Post (Vertical center strut)
      addCylinderBeam(pCenter, pPeak, memberRadius * 0.9, frameMat);

      // Diagonal web struts
      const pQuarterL = new THREE.Vector3(-halfSpan / 2, height, z);
      const pQuarterR = new THREE.Vector3(halfSpan / 2, height, z);
      addCylinderBeam(pQuarterL, pPeak, memberRadius * 0.7, frameMat);
      addCylinderBeam(pQuarterR, pPeak, memberRadius * 0.7, frameMat);
    });

    // 5. Ridge Beam (Apex beam connecting peaks)
    addCylinderBeam(
      new THREE.Vector3(0, height + roofHeight, -halfLength),
      new THREE.Vector3(0, height + roofHeight, halfLength),
      memberRadius * 1.1,
      frameMat
    );

    // 6. Roof Covering Surface
    // Left roof slope plane
    const leftSlopeGeom = new THREE.PlaneGeometry(
      Math.sqrt(halfSpan * halfSpan + roofHeight * roofHeight),
      length
    );
    const leftSlope = new THREE.Mesh(leftSlopeGeom, roofMat);
    leftSlope.position.set(-halfSpan / 2, height + roofHeight / 2, 0);
    leftSlope.rotation.y = Math.PI / 2;
    leftSlope.rotation.x = Math.atan2(roofHeight, halfSpan);
    group.add(leftSlope);

    // Right roof slope plane
    const rightSlopeGeom = new THREE.PlaneGeometry(
      Math.sqrt(halfSpan * halfSpan + roofHeight * roofHeight),
      length
    );
    const rightSlope = new THREE.Mesh(rightSlopeGeom, roofMat);
    rightSlope.position.set(halfSpan / 2, height + roofHeight / 2, 0);
    rightSlope.rotation.y = Math.PI / 2;
    rightSlope.rotation.x = -Math.atan2(roofHeight, halfSpan);
    group.add(rightSlope);

  }, [span, height, length, pitch, material]);

  const resetView = () => {
    rotationRef.current = { x: 0.35, y: -0.65 };
    if (cameraRef.current) {
      cameraRef.current.position.set(8, 6, 10);
      cameraRef.current.lookAt(0, 1.8, 0);
    }
    setZoomLevel(100);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: viewMode === '3d' ? 'grab' : 'default',
        }}
      />

      {/* Floating Canvas Toolbar */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          justifyContent: 'center',
          background: 'rgba(22, 35, 43, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          zIndex: 10,
        }}
      >
        <button
          style={{
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            background: viewMode === '3d' ? 'var(--lime)' : 'transparent',
            border: '1px solid',
            borderColor: viewMode === '3d' ? 'var(--lime)' : 'rgba(255,255,255,0.2)',
            color: viewMode === '3d' ? '#000' : '#fff',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setViewMode('3d')}
        >
          <Box size={14} /> 3D Orbit
        </button>

        <button
          style={{
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            background: viewMode === '2d' ? 'var(--lime)' : 'transparent',
            border: '1px solid',
            borderColor: viewMode === '2d' ? 'var(--lime)' : 'rgba(255,255,255,0.2)',
            color: viewMode === '2d' ? '#000' : '#fff',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setViewMode('2d')}
        >
          <Eye size={14} /> 2D Elevation
        </button>

        <span style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 6px' }} />

        <button
          style={{
            width: '32px', height: '32px', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', background: 'transparent', borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
          title="Reset Camera"
          onClick={resetView}
        >
          <RotateCw size={13} />
        </button>

        <button
          style={{
            width: '32px', height: '32px', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', background: 'transparent', borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
          title="Zoom In"
          onClick={() => {
            if (cameraRef.current) {
              cameraRef.current.position.multiplyScalar(0.9);
              setZoomLevel((z) => Math.min(250, Math.round(z * 1.1)));
            }
          }}
        >
          <ZoomIn size={13} />
        </button>

        <button
          style={{
            width: '32px', height: '32px', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', background: 'transparent', borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
          title="Zoom Out"
          onClick={() => {
            if (cameraRef.current) {
              cameraRef.current.position.multiplyScalar(1.1);
              setZoomLevel((z) => Math.max(50, Math.round(z * 0.9)));
            }
          }}
        >
          <ZoomOut size={13} />
        </button>

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', padding: '0 6px', minWidth: '45px', textAlign: 'right' }}>
          {zoomLevel}%
        </span>
      </div>
    </div>
  );
};
