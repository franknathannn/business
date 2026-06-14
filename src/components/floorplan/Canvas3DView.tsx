'use client';

import React, { useRef, useEffect, useState, MouseEvent, WheelEvent } from 'react';
import { Seat, Point3D, ExitEntrance, Staircase } from './types';
import { COURT_LENGTH, COURT_WIDTH, BARRIER_HEIGHT, BOWL_BASE_OCTAGON, BOWL_TOP_OCTAGON, STAGE, EXITS_ENTRANCES, STAIRCASES } from './constants';

interface Canvas3DViewProps {
  seats: Seat[];
  onSeatHover: (seat: Seat | null) => void;
  onSeatSelect: (seat: Seat | null) => void;
  selectedSeat: Seat | null;
  hoveredSeat: Seat | null;
  showNames: boolean;
  onShowNamesChange: (val: boolean) => void;
}

export const Canvas3DView: React.FC<Canvas3DViewProps> = ({
  seats,
  onSeatHover,
  onSeatSelect,
  selectedSeat,
  hoveredSeat,
  showNames,
  onShowNamesChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Camera state
  const [yaw, setYaw] = useState<number>(3 * Math.PI / 4); // Look from South-West (above)
  const [pitch, setPitch] = useState<number>(Math.PI / 3.2); // Pitch angle (tilt down from above)
  const [zoom, setZoom] = useState<number>(3.0); // Make the model larger
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // Center panning
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showExitRoute, setShowExitRoute] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isLegendMinimized, setIsLegendMinimized] = useState<boolean>(false);

  // Projection logic
  // Target center of orbit
  const target = { x: 0, y: 0, z: 15 };
  const cameraDistance = 380;
  const fov = 340;

  // Project a 3D point to 2D Screen space
  const project = (pt: Point3D, width: number, height: number) => {
    // Translate relative to target
    const dx = pt.x - target.x;
    const dy = pt.y - target.y;
    const dz = pt.z - target.z;

    // Rotate around Z axis (yaw)
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const rx = dx * cosY - dy * sinY;
    const ry = dx * sinY + dy * cosY;
    const rz = dz;

    // Rotate around X axis (pitch) - Camera looking down from above Z
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const x = rx;
    const y = ry * cosP + rz * sinP;
    const z = -ry * sinP + rz * cosP;

    // Perspective calculation
    const depth = cameraDistance - y;
    if (depth <= 0) return null;

    const scale = fov / depth;
    const screenX = width / 2 + (x * scale * zoom) + pan.x;
    const screenY = height / 2 - (z * scale * zoom) + pan.y;

    return { x: screenX, y: screenY, depth };
  };

  // Drag handlers for orbit/pan
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      if (e.shiftKey) {
        // Pan
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      } else {
        // Orbit
        setYaw(prev => prev - dx * 0.007);
        setPitch(prev => Math.max(0.1, Math.min(Math.PI / 2 - 0.05, prev - dy * 0.007)));
      }
      dragStart.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Hover detection
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closestSeat: Seat | null = null;
    let minDistance = 12; // Radius in pixels to trigger hover

    seats.forEach(seat => {
      const proj = project(seat.pos, canvas.width, canvas.height);
      if (proj) {
        const dist = Math.hypot(proj.x - mouseX, proj.y - mouseY);
        if (dist < minDistance) {
          minDistance = dist;
          closestSeat = seat;
        }
      }
    });

    onSeatHover(closestSeat);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closestSeat: Seat | null = null;
    let minDistance = 12;

    seats.forEach(seat => {
      const proj = project(seat.pos, canvas.width, canvas.height);
      if (proj) {
        const dist = Math.hypot(proj.x - mouseX, proj.y - mouseY);
        if (dist < minDistance) {
          minDistance = dist;
          closestSeat = seat;
        }
      }
    });

    if (closestSeat) {
      onSeatSelect(closestSeat);
    } else {
      onSeatSelect(null);
    }
  };

  const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(8.0, prev * zoomFactor));
    } else {
      setZoom(prev => Math.max(0.5, prev / zoomFactor));
    }
  };

  // Find the exit route coordinates for a selected seat
  const getExitRoute = (seat: Seat): { points: Point3D[]; exit: ExitEntrance } | null => {
    const isFloorSeat = seat.sectionId === 'vip_floor' || seat.sectionId === 'faculty_floor';

    if (isFloorSeat) {
      // Floor-level seats: Walk directly to the closest floor door
      const floorExits = EXITS_ENTRANCES.filter(gate => gate.id.startsWith('floor'));
      let closestExit: ExitEntrance | null = null;
      let minExitDist = Infinity;
      for (const gate of floorExits) {
        const dist = Math.hypot(gate.pos.x - seat.pos.x, gate.pos.y - seat.pos.y);
        if (dist < minExitDist) {
          minExitDist = dist;
          closestExit = gate;
        }
      }

      if (!closestExit) return null;

      return {
        points: [
          seat.pos,
          { x: closestExit.pos.x * 0.85, y: closestExit.pos.y * 0.85, z: 0.5 },
          closestExit.pos
        ],
        exit: closestExit
      };
    } else {
      // Bleacher seats: Find closest staircase in the same section, or absolute closest
      let closestStair = STAIRCASES.find(s => s.sectionId === seat.sectionId);
      if (!closestStair) {
        let minDist = Infinity;
        for (const stair of STAIRCASES) {
          const dist = Math.hypot(stair.posStart.x - seat.pos.x, stair.posStart.y - seat.pos.y);
          if (dist < minDist) {
            minDist = dist;
            closestStair = stair;
          }
        }
      }

      if (!closestStair) return null;

      // Bleacher seats can only exit via tunnel portals
      const tunnelExits = EXITS_ENTRANCES.filter(gate => gate.id.startsWith('tunnel'));
      let closestExit: ExitEntrance | null = null;
      let minExitDist = Infinity;
      for (const gate of tunnelExits) {
        // Distance from gate to top of the stairs (posEnd)
        const dist = Math.hypot(gate.pos.x - closestStair!.posEnd.x, gate.pos.y - closestStair!.posEnd.y);
        if (dist < minExitDist) {
          minExitDist = dist;
          closestExit = gate;
        }
      }

      if (!closestExit) return null;

      // Project seat to the row height on the staircase
      const hDiff = closestStair.posEnd.z - closestStair.posStart.z;
      const pct = (seat.pos.z - closestStair.posStart.z) / hDiff;
      const stairRowPt = {
        x: closestStair.posStart.x + (closestStair.posEnd.x - closestStair.posStart.x) * pct,
        y: closestStair.posStart.y + (closestStair.posEnd.y - closestStair.posStart.y) * pct,
        z: seat.pos.z
      };

      return {
        points: [
          seat.pos,
          stairRowPt,
          closestExit.pos
        ],
        exit: closestExit
      };
    }
  };

  // Main draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Enable anti-aliasing
    ctx.imageSmoothingEnabled = true;

    const w = canvas.width;
    const h = canvas.height;

    // Render components list (drawn in order of depth to handle occlusion)
    interface Renderable {
      depth: number;
      draw: () => void;
    }
    const renderQueue: Renderable[] = [];

    // Helper to add polygons
    const addPolygon = (pts: Point3D[], fillColor: string, strokeColor: string | null = null, lineWidth = 1) => {
      const projectedPts = pts.map(p => project(p, w, h)).filter(p => p !== null) as { x: number; y: number; depth: number }[];
      if (projectedPts.length < 3) return;

      // Average depth
      const avgDepth = projectedPts.reduce((acc, curr) => acc + curr.depth, 0) / projectedPts.length;

      renderQueue.push({
        depth: avgDepth,
        draw: () => {
          ctx.beginPath();
          ctx.moveTo(projectedPts[0].x, projectedPts[0].y);
          for (let i = 1; i < projectedPts.length; i++) {
            ctx.lineTo(projectedPts[i].x, projectedPts[i].y);
          }
          ctx.closePath();
          ctx.fillStyle = fillColor;
          ctx.fill();
          if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        }
      });
    };

    // Helper to add 3D lines
    const addLine = (p1: Point3D, p2: Point3D, color: string, width = 1, dash: number[] = []) => {
      const proj1 = project(p1, w, h);
      const proj2 = project(p2, w, h);
      if (!proj1 || !proj2) return;

      const avgDepth = (proj1.depth + proj2.depth) / 2;

      renderQueue.push({
        depth: avgDepth,
        draw: () => {
          ctx.beginPath();
          ctx.moveTo(proj1.x, proj1.y);
          ctx.lineTo(proj2.x, proj2.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          if (dash.length > 0) {
            ctx.setLineDash(dash);
          } else {
            ctx.setLineDash([]);
          }
          ctx.stroke();
          ctx.setLineDash([]); // Reset
        }
      });
    };

    // Helper to add Text labels in 3D
    const addText = (text: string, pos: Point3D, color: string, font = '10px Outfit, sans-serif', align: CanvasTextAlign = 'center') => {
      const proj = project(pos, w, h);
      if (!proj) return;

      renderQueue.push({
        depth: proj.depth + 0.1, // Draw slightly in front
        draw: () => {
          ctx.font = font;
          ctx.fillStyle = color;
          ctx.textAlign = align;
          ctx.textBaseline = 'middle';
          ctx.fillText(text, proj.x, proj.y);
        }
      });
    };

    // 1. Draw Basketball Court
    const halfL = COURT_LENGTH / 2;
    const halfW = COURT_WIDTH / 2;
    const courtCorners: Point3D[] = [
      { x: -halfL, y: -halfW, z: 0 },
      { x: halfL, y: -halfW, z: 0 },
      { x: halfL, y: halfW, z: 0 },
      { x: -halfL, y: halfW, z: 0 }
    ];
    // Warm wooden court color
    addPolygon(courtCorners, '#eab30822', '#eab30844', 2); // Court base
    
    // Draw court lines
    // Center line
    addLine({ x: 0, y: -halfW, z: 0 }, { x: 0, y: halfW, z: 0 }, '#eab30833', 1.5);
    // Center circle
    const circlePoints = 32;
    const circleRadius = 12;
    const centerCircle: Point3D[] = [];
    for (let i = 0; i <= circlePoints; i++) {
      const theta = (i / circlePoints) * Math.PI * 2;
      centerCircle.push({
        x: Math.cos(theta) * circleRadius,
        y: Math.sin(theta) * circleRadius,
        z: 0
      });
    }
    for (let i = 0; i < circlePoints; i++) {
      addLine(centerCircle[i], centerCircle[i+1], '#eab30833', 1.5);
    }
    
    // Three-point arcs
    const drawThreePointArc = (side: 1 | -1) => {
      const arcRadius = 45;
      const arcPoints = 16;
      const originX = side * halfL;
      
      const arcPts: Point3D[] = [];
      const baseAngle = side === 1 ? Math.PI / 2 : -Math.PI / 2;
      for (let i = 0; i <= arcPoints; i++) {
        // angle from -90 deg to 90 deg relative to basket
        const angle = baseAngle + (i / arcPoints) * Math.PI - Math.PI/2;
        const ptX = originX - side * Math.cos(angle) * arcRadius;
        const ptY = Math.sin(angle) * arcRadius;
        
        // Clip arc to court dimensions
        if (Math.abs(ptY) <= halfW) {
          arcPts.push({ x: ptX, y: ptY, z: 0 });
        }
      }
      for (let i = 0; i < arcPts.length - 1; i++) {
        addLine(arcPts[i], arcPts[i+1], '#3b82f644', 1.5);
      }
    };
    drawThreePointArc(1);
    drawThreePointArc(-1);

    // 2. Draw Bleacher Tiers (Concrete steps)
    // We render the 8-sided bowl flaring out
    // By creating horizontal rings at each step
    const stepsCount = 8;
    const stepHeight = 5.5;
    const stepDepth = 5.0;

    for (let step = 0; step < stepsCount; step++) {
      const z1 = BARRIER_HEIGHT + step * stepHeight;
      const z2 = BARRIER_HEIGHT + (step + 1) * stepHeight;
      
      // Calculate octagonal points for this tier level
      // Octagon geometry: long walls along X-axis, short walls along Y-axis
      const getOctagonPoints = (stepIndex: number, height: number): Point3D[] => {
        const f = stepIndex * stepDepth;
        return [
          { x: -70 - f, y: -60 - f, z: height },   // SW corner of south long wall
          { x:  70 + f, y: -60 - f, z: height },   // SE corner of south long wall
          { x:  95 + f, y: -35 - f, z: height },   // SE diagonal → east short wall
          { x:  95 + f, y:  35 + f, z: height },   // East short wall → NE diagonal
          { x:  70 + f, y:  60 + f, z: height },   // NE corner of north long wall
          { x: -70 - f, y:  60 + f, z: height },   // NW corner of north long wall
          { x: -95 - f, y:  35 + f, z: height },   // NW diagonal → west short wall
          { x: -95 - f, y: -35 - f, z: height }    // West short wall → SW diagonal
        ];
      };

      const innerRing = getOctagonPoints(step, z1);
      const outerRing = getOctagonPoints(step + 1, z1); // Step tread
      const riserRing = getOctagonPoints(step + 1, z2); // Step riser

      // Add polygons for each side of the octagon
      for (let i = 0; i < 8; i++) {
        const next = (i + 1) % 8;
        
        // Tread (flat concrete walking surface of the row)
        // Shade based on elevation (lighter concrete at top)
        const treadColor = `rgba(${50 + step * 5}, ${55 + step * 5}, ${65 + step * 5}, 0.85)`;
        addPolygon(
          [innerRing[i], innerRing[next], outerRing[next], outerRing[i]],
          treadColor,
          '#1e293b55',
          0.5
        );

        // Riser (vertical concrete kick-plate)
        // Darker concrete shade because it is vertical
        const riserColor = `rgba(${35 + step * 4}, ${38 + step * 4}, ${45 + step * 4}, 0.9)`;
        addPolygon(
          [outerRing[i], outerRing[next], riserRing[next], riserRing[i]],
          riserColor,
          '#0f172a55',
          0.5
        );
      }
    }

    // 2.5. Draw Concrete Barrier Wall (Vertical retaining wall separating court floor from seating bowl)
    const baseOct = BOWL_BASE_OCTAGON;
    for (let i = 0; i < 8; i++) {
      const next = (i + 1) % 8;
      const pt1 = baseOct[i];
      const pt2 = baseOct[next];

      // Calculate segment normal pointing outward to give the wall 3D thickness/ledge
      const midX = (pt1.x + pt2.x) / 2;
      const midY = (pt1.y + pt2.y) / 2;
      const lenMid = Math.hypot(midX, midY);
      const nx = lenMid > 0 ? midX / lenMid : 0;
      const ny = lenMid > 0 ? midY / lenMid : 0;
      const t = 2.2; // Wall thickness

      // Check if this is a diagonal corner side (indices 1, 3, 5, 7)
      const isDiagonal = i % 2 !== 0;

      if (isDiagonal) {
        // Split the wall into two panels to leave a gap for the vomitory portal
        const dx = pt2.x - pt1.x;
        const dy = pt2.y - pt1.y;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;

        const gapHalfWidth = 4.5;
        const gapStart = { x: midX - gapHalfWidth * ux, y: midY - gapHalfWidth * uy, z: 0 };
        const gapEnd = { x: midX + gapHalfWidth * ux, y: midY + gapHalfWidth * uy, z: 0 };

        // Panel 1: from pt1 to gapStart
        const wallPanel1 = [
          { x: pt1.x, y: pt1.y, z: 0 },
          { x: gapStart.x, y: gapStart.y, z: 0 },
          { x: gapStart.x, y: gapStart.y, z: BARRIER_HEIGHT },
          { x: pt1.x, y: pt1.y, z: BARRIER_HEIGHT }
        ];

        // Ledge 1: horizontal thickness top
        const ledge1 = [
          { x: pt1.x, y: pt1.y, z: BARRIER_HEIGHT },
          { x: gapStart.x, y: gapStart.y, z: BARRIER_HEIGHT },
          { x: gapStart.x + t * nx, y: gapStart.y + t * ny, z: BARRIER_HEIGHT },
          { x: pt1.x + t * nx, y: pt1.y + t * ny, z: BARRIER_HEIGHT }
        ];

        // Panel 2: from gapEnd to pt2
        const wallPanel2 = [
          { x: gapEnd.x, y: gapEnd.y, z: 0 },
          { x: pt2.x, y: pt2.y, z: 0 },
          { x: pt2.x, y: pt2.y, z: BARRIER_HEIGHT },
          { x: gapEnd.x, y: gapEnd.y, z: BARRIER_HEIGHT }
        ];

        // Ledge 2: horizontal thickness top
        const ledge2 = [
          { x: gapEnd.x, y: gapEnd.y, z: BARRIER_HEIGHT },
          { x: pt2.x, y: pt2.y, z: BARRIER_HEIGHT },
          { x: pt2.x + t * nx, y: pt2.y + t * ny, z: BARRIER_HEIGHT },
          { x: gapEnd.x + t * nx, y: gapEnd.y + t * ny, z: BARRIER_HEIGHT }
        ];

        addPolygon(wallPanel1, 'rgba(71, 85, 105, 0.95)', '#1e293b', 1.5);
        addPolygon(wallPanel2, 'rgba(71, 85, 105, 0.95)', '#1e293b', 1.5);
        addPolygon(ledge1, '#334155', '#1e293b', 1);
        addPolygon(ledge2, '#334155', '#1e293b', 1);
      } else {
        // Continuous wall panel for flat sides
        const wallPanel = [
          { x: pt1.x, y: pt1.y, z: 0 },
          { x: pt2.x, y: pt2.y, z: 0 },
          { x: pt2.x, y: pt2.y, z: BARRIER_HEIGHT },
          { x: pt1.x, y: pt1.y, z: BARRIER_HEIGHT }
        ];

        // Ledge: horizontal thickness top
        const ledge = [
          { x: pt1.x, y: pt1.y, z: BARRIER_HEIGHT },
          { x: pt2.x, y: pt2.y, z: BARRIER_HEIGHT },
          { x: pt2.x + t * nx, y: pt2.y + t * ny, z: BARRIER_HEIGHT },
          { x: pt1.x + t * nx, y: pt1.y + t * ny, z: BARRIER_HEIGHT }
        ];

        addPolygon(wallPanel, 'rgba(71, 85, 105, 0.95)', '#1e293b', 1.5);
        addPolygon(ledge, '#334155', '#1e293b', 1);
      }
    }

    // 3. Draw Stage
    // Drawn as a solid 3D box
    const stg = STAGE;
    const stageBox: Point3D[][] = [
      // Top face
      [
        { x: stg.x, y: stg.y, z: stg.height },
        { x: stg.x + stg.width, y: stg.y, z: stg.height },
        { x: stg.x + stg.width, y: stg.y + stg.depth, z: stg.height },
        { x: stg.x, y: stg.y + stg.depth, z: stg.height }
      ],
      // South face (facing audience)
      [
        { x: stg.x, y: stg.y, z: 0 },
        { x: stg.x + stg.width, y: stg.y, z: 0 },
        { x: stg.x + stg.width, y: stg.y, z: stg.height },
        { x: stg.x, y: stg.y, z: stg.height }
      ],
      // West face
      [
        { x: stg.x, y: stg.y, z: 0 },
        { x: stg.x, y: stg.y + stg.depth, z: 0 },
        { x: stg.x, y: stg.y + stg.depth, z: stg.height },
        { x: stg.x, y: stg.y, z: stg.height }
      ],
      // East face
      [
        { x: stg.x + stg.width, y: stg.y, z: 0 },
        { x: stg.x + stg.width, y: stg.y + stg.depth, z: 0 },
        { x: stg.x + stg.width, y: stg.y + stg.depth, z: stg.height },
        { x: stg.x + stg.width, y: stg.y, z: stg.height }
      ]
    ];

    addPolygon(stageBox[0], '#475569', '#334155', 2); // Stage top
    addPolygon(stageBox[1], '#1e293b', '#334155', 1); // Stage front
    addPolygon(stageBox[2], '#334155', '#1e293b', 1); // Stage sides
    addPolygon(stageBox[3], '#334155', '#1e293b', 1);
    
    // Stage Text Label
    addText('MAIN STAGE', { x: stg.x + stg.width / 2, y: stg.y + stg.depth / 2, z: stg.height + 0.5 }, '#ffffff', 'bold 9px Outfit, sans-serif');

    // Stand & District Labels (Rendered on top at Z=58, only when showNames is ON)
    if (showNames) {
      // South Stand: Districts 1, 2, 3 (South is y ~ -65 to -100, push label Y further south to -115)
      addText('DISTRICT 1', { x: -40, y: -115, z: 58 }, '#06b6d4', 'bold 14px Outfit, sans-serif');
      addText('DISTRICT 2', { x: 0,   y: -115, z: 58 }, '#0ea5e9', 'bold 14px Outfit, sans-serif');
      addText('DISTRICT 3', { x: 40,  y: -115, z: 58 }, '#3b82f6', 'bold 14px Outfit, sans-serif');

      // North Stand: Districts 4, 5, 6 (North is y ~ 65 to 100, push label Y further north to 115)
      addText('DISTRICT 4', { x: -40, y: 115, z: 58 }, '#6366f1', 'bold 14px Outfit, sans-serif');
      addText('DISTRICT 5', { x: 0,   y: 115, z: 58 }, '#8b5cf6', 'bold 14px Outfit, sans-serif');
      addText('DISTRICT 6', { x: 40,  y: 115, z: 58 }, '#d946ef', 'bold 14px Outfit, sans-serif');

      // Parents & Guests (West is x ~ -100 to -140, push label X further west to -145)
      addText('PARENTS & GUESTS', { x: -145, y: 0, z: 58 }, '#10b981', 'bold 14px Outfit, sans-serif');
    }

    // 4. Draw Staircases (Yellow stripe markings)
    STAIRCASES.forEach(stair => {
      // Draw as a colored stripe going up
      addLine(stair.posStart, stair.posEnd, '#f59e0b', 3);
    });

    // 5. Draw Exits / Entrances (Portals)
    EXITS_ENTRANCES.forEach(gate => {
      const r = gate.width / 2;
      const angle = gate.facing;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const leftBase = { x: gate.pos.x - r * sin, y: gate.pos.y + r * cos, z: gate.pos.z };
      const rightBase = { x: gate.pos.x + r * sin, y: gate.pos.y - r * cos, z: gate.pos.z };
      
      const isFloorDoor = gate.pos.z < 5; // Floor-level doors at z=0
      const archHeight = isFloorDoor ? 7.5 : 8;
      const leftTop = { ...leftBase, z: leftBase.z + archHeight };
      const rightTop = { ...rightBase, z: rightBase.z + archHeight };

      if (isFloorDoor) {
        // Floor-level doors: brown wooden door frame with green EXIT sign
        addLine(leftBase, leftTop, '#92400e', 4);  // Brown door frame
        addLine(rightBase, rightTop, '#92400e', 4);
        addLine(leftTop, rightTop, '#92400e', 4);
        // Door fill (brown rectangle)
        addPolygon([leftBase, rightBase, rightTop, leftTop], 'rgba(120, 53, 15, 0.5)', '#92400e', 2);
        // Green EXIT sign above
        addText('EXIT', { x: gate.pos.x, y: gate.pos.y, z: archHeight + 2 }, '#22c55e', 'bold 8px Outfit, sans-serif');
      } else {
        // Bleacher-level exits: 3D concrete vomitory portal enclosure (mouth structure)
        const W = gate.width;
        const D = 8.5; // Depth of landing (increased to make side walls longer in length)
        const H = 4.5; // Wall height
        
        // Vectors for tangent and normal
        const nx = cos;
        const ny = sin;
        const tx = -sin;
        const ty = cos;

        // Offset the vomitory landing start slightly back (away from the court) by 3.0 units to clear the floor doors
        const startOffset = 3.0;
        const startPt = { x: gate.pos.x - startOffset * nx, y: gate.pos.y - startOffset * ny };

        // Base vertices of the landing box (z = 25)
        const fl = { x: startPt.x - (W / 2) * tx, y: startPt.y - (W / 2) * ty, z: gate.pos.z };
        const fr = { x: startPt.x + (W / 2) * tx, y: startPt.y + (W / 2) * ty, z: gate.pos.z };
        const bl = { x: fl.x - D * nx, y: fl.y - D * ny, z: gate.pos.z };
        const br = { x: fr.x - D * nx, y: fr.y - D * ny, z: gate.pos.z };

        // Top vertices of the landing box walls (z = 25 + H)
        const fl_t = { ...fl, z: fl.z + H };
        const fr_t = { ...fr, z: fr.z + H };
        const bl_t = { ...bl, z: bl.z + H };
        const br_t = { ...br, z: br.z + H };

        // 1. Red concrete landing floor
        addPolygon([fl, fr, br, bl], '#7f1d1d', '#991b1b', 1);

        // 2. Left red concrete wall
        addPolygon([fl, bl, bl_t, fl_t], '#991b1b', '#ef4444', 1);

        // 3. Right red concrete wall
        addPolygon([fr, br, br_t, fr_t], '#991b1b', '#ef4444', 1);

        // 4. Back red concrete wall (landing barrier enclosure)
        addPolygon([bl, br, br_t, bl_t], '#881337', '#ef4444', 1);

        // Red EXIT sign inside the vomitory recessed back wall
        addText('EXIT', { x: (bl.x + br.x)/2, y: (bl.y + br.y)/2, z: gate.pos.z + H/2 }, '#ef4444', 'bold 5px Outfit, sans-serif');

        // 5. Metal Handrails (glowing Red railings on top of concrete walls)
        addLine(fl_t, bl_t, '#f87171', 2);
        addLine(fr_t, br_t, '#f87171', 2);
        addLine(bl_t, br_t, '#f87171', 2);

        // Portal label
        addText('EXIT PORTAL', { x: gate.pos.x - (D/2)*nx, y: gate.pos.y - (D/2)*ny, z: gate.pos.z + H + 2.5 }, '#f87171', 'bold 7px Outfit, sans-serif');
      }
    });

    // 6. Draw Seats
    seats.forEach(seat => {
      const proj = project(seat.pos, w, h);
      if (!proj) return;

      const isHovered = hoveredSeat?.id === seat.id;
      const isSelected = selectedSeat?.id === seat.id;

      renderQueue.push({
        depth: proj.depth - (isSelected ? 40.0 : isHovered ? 35.0 : 30.0), // Subtract to bring seats forward in Painters algorithm
        draw: () => {
          let color = '#3b82f6'; // Guest (blue)
          if (seat.seatClass === 'VIP') color = '#ef4444'; // VIP (red)
          else if (seat.seatClass === 'Graduate') color = '#eab308'; // Graduate (yellow/gold)
          else if (seat.seatClass === 'Reserved') color = '#10b981'; // Reserved (green)

          // District color overrides
          if (seat.sectionId === 'south') {
            if (seat.number <= 6) {
              color = '#06b6d4'; // District 1: Teal/Cyan
            } else if (seat.number <= 12) {
              color = '#0ea5e9'; // District 2: Sky Blue
            } else {
              color = '#3b82f6'; // District 3: Royal Blue
            }
          } else if (seat.sectionId === 'north') {
            if (seat.number <= 6) {
              color = '#6366f1'; // District 4: Indigo
            } else if (seat.number <= 12) {
              color = '#8b5cf6'; // District 5: Purple
            } else {
              color = '#d946ef'; // District 6: Fuchsia
            }
          }

          if (seat.status === 'occupied') {
            color = '#475569'; // Greyed out for occupied
          }

          // Size of seat dot
          let radius = isSelected ? 6.5 : isHovered ? 5.5 : 3.2;

          const isMonoblock = seat.row === 'A' && ['north', 'south', 'west', 'east', 'nw', 'ne', 'sw', 'se'].includes(seat.sectionId);

          // Drawing
          ctx.beginPath();
          if (isMonoblock) {
            // Draw monoblock chair as a square cube/rectangle on the flat ledge
            const size = radius * 1.4;
            ctx.rect(proj.x - size / 2, proj.y - size / 2, size, size);
          } else {
            ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
          }
          ctx.fillStyle = color;
          ctx.fill();

          // Highlight circles/squares
          if (isSelected) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Pulsing select indicator outer ring
            ctx.beginPath();
            if (isMonoblock) {
              const size = radius * 1.4 + 4;
              ctx.rect(proj.x - size / 2, proj.y - size / 2, size, size);
            } else {
              ctx.arc(proj.x, proj.y, radius + 4, 0, Math.PI * 2);
            }
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (isHovered) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (seat.status !== 'occupied') {
            // Subtle shadow stroke for better contrast
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
    });

    // 7. Draw Exit Route if seat is selected
    if (selectedSeat && showExitRoute) {
      const route = getExitRoute(selectedSeat);
      if (route) {
        for (let i = 0; i < route.points.length - 1; i++) {
          addLine(route.points[i], route.points[i + 1], '#ef4444', 3, [4, 4]); // Red dashed path
        }
        
        // Highlight destination exit
        const endProj = project(route.exit.pos, w, h);
        if (endProj) {
          renderQueue.push({
            depth: endProj.depth + 3,
            draw: () => {
              ctx.beginPath();
              ctx.arc(endProj.x, endProj.y, 14, 0, Math.PI * 2);
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2.5;
              ctx.setLineDash([3, 2]);
              ctx.stroke();
              ctx.setLineDash([]);
              
              // Direction indicator arrow above portal
              ctx.fillStyle = '#ef4444';
              ctx.font = 'bold 9px Outfit, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('NEAREST EXIT', endProj.x, endProj.y - 18);
            }
          });
        }
      }
    }

    // Sort queue by depth (Painters Algorithm: back to front)
    renderQueue.sort((a, b) => b.depth - a.depth);

    // Run draw commands
    renderQueue.forEach(item => item.draw());

    // Render controls hint in corner
    ctx.font = '10px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'left';
    ctx.fillText('Left-Click & Drag: Rotate/Tilt Camera', 15, h - 35);
    ctx.fillText('Shift + Drag: Pan Camera', 15, h - 20);
    ctx.fillText('Mouse Wheel: Zoom View', 15, h - 5);

  }, [yaw, pitch, zoom, pan, seats, selectedSeat, hoveredSeat, showExitRoute]);

  // Adjust canvas resolution for high DPI displays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <div className="relative w-full h-[550px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,41,59,0.4),transparent)] pointer-events-none" />
      
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleMouseClick}
        onWheel={handleWheel}
      />

      {/* Floating Camera UI controls */}
      <div className={`absolute top-4 right-4 flex flex-col transition-all bg-slate-900/85 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl select-none ${isMinimized ? 'w-10 h-10 items-center justify-center p-0 overflow-hidden' : 'w-40 gap-3'}`}>
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className="w-full h-full flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
            title="Expand Camera Controls"
          >
            📹
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1">📹 Controls</span>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
                title="Minimize Camera Controls"
              >
                _
              </button>
            </div>
            
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Camera Zoom</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setZoom(prev => Math.min(8.0, prev * 1.2))}
                  className="flex-1 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-lg transition-colors border border-slate-700"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={() => setZoom(prev => Math.max(0.5, prev / 1.2))}
                  className="flex-1 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-lg transition-colors border border-slate-700"
                  title="Zoom Out"
                >
                  −
                </button>
              </div>
            </div>

            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase border-t border-slate-800 pt-2">View Angles</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  setYaw(3 * Math.PI / 4);
                  setPitch(Math.PI / 3.2);
                  setZoom(3.0);
                  setPan({ x: 0, y: 0 });
                }}
                className="h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-[10px] font-medium transition-colors border border-slate-700"
                title="Default 3D Perspective View"
              >
                DEFAULT
              </button>
              <button
                onClick={() => {
                  setYaw(Math.PI);
                  setPitch(Math.PI / 2 - 0.05);
                  setZoom(3.0);
                  setPan({ x: 0, y: 0 });
                }}
                className="h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-[10px] font-medium transition-colors border border-slate-700"
                title="Birds-eye top-down view"
              >
                TOP
              </button>
              <button
                onClick={() => {
                  setYaw(Math.PI / 2);
                  setPitch(Math.PI / 5);
                  setZoom(3.2);
                  setPan({ x: 0, y: 0 });
                }}
                className="h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-[10px] font-medium transition-colors border border-slate-700"
                title="Front Stage view (looking East)"
              >
                FRONT
              </button>
              <button
                onClick={() => {
                  setYaw(Math.PI);
                  setPitch(Math.PI / 6);
                  setZoom(3.2);
                  setPan({ x: 0, y: 0 });
                }}
                className="h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-[10px] font-medium transition-colors border border-slate-700"
                title="Side view (looking North)"
              >
                SIDE
              </button>
            </div>

            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase border-t border-slate-800 pt-2">Diagonals</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  setYaw(3 * Math.PI / 4);
                  setPitch(Math.PI / 4);
                  setZoom(3.0);
                  setPan({ x: 0, y: 0 });
                }}
                className="h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-[10px] font-medium transition-colors border border-slate-700"
                title="Top Left Angle"
              >
                TOP L
              </button>
              <button
                onClick={() => {
                  setYaw(5 * Math.PI / 4);
                  setPitch(Math.PI / 4);
                  setZoom(3.0);
                  setPan({ x: 0, y: 0 });
                }}
                className="h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-[10px] font-medium transition-colors border border-slate-700"
                title="Top Right Angle"
              >
                TOP R
              </button>
              <button
                onClick={() => {
                  setYaw(Math.PI / 4);
                  setPitch(Math.PI / 4);
                  setZoom(3.0);
                  setPan({ x: 0, y: 0 });
                }}
                className="h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-[10px] font-medium transition-colors border border-slate-700"
                title="Bottom Left Angle"
              >
                BTM L
              </button>
              <button
                onClick={() => {
                  setYaw(7 * Math.PI / 4);
                  setPitch(Math.PI / 4);
                  setZoom(3.0);
                  setPan({ x: 0, y: 0 });
                }}
                className="h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-[10px] font-medium transition-colors border border-slate-700"
                title="Bottom Right Angle"
              >
                BTM R
              </button>
            </div>

            <div className="border-t border-slate-800 pt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Routes</span>
                <button
                  onClick={() => setShowExitRoute(prev => !prev)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold text-white transition-all border ${
                    showExitRoute 
                      ? 'bg-amber-600 border-amber-500 hover:bg-amber-500' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Toggle Exit Route Guide"
                >
                  {showExitRoute ? 'ON 🚪' : 'OFF 🚪'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Names</span>
                <button
                  onClick={() => onShowNamesChange(!showNames)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold text-white transition-all border ${
                    showNames 
                      ? 'bg-blue-600 border-blue-500 hover:bg-blue-500' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Toggle District Names"
                >
                  {showNames ? 'ON 🏷️' : 'OFF 🏷️'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Bar ON TOP! for Names Toggle */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 select-none z-10 transition-all">
        <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase">Names Toggle</span>
        <button
          onClick={() => onShowNamesChange(!showNames)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all border shadow-md cursor-pointer ${
            showNames 
              ? 'bg-blue-600 border-blue-500 hover:bg-blue-500' 
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
          }`}
          title="Toggle District Names"
        >
          {showNames ? 'ON 🏷️' : 'OFF 🏷️'}
        </button>
      </div>

      {/* Legend & Stats Overlay */}
      <div className={`absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-xl shadow-lg select-none transition-all ${isLegendMinimized ? 'w-10 h-10 flex items-center justify-center p-0 overflow-hidden' : 'px-3 py-2.5 text-[10px] text-slate-300 flex flex-col gap-1.5'}`}>
        {isLegendMinimized ? (
          <button
            onClick={() => setIsLegendMinimized(false)}
            className="w-full h-full flex items-center justify-center text-white hover:bg-slate-800 transition-colors text-sm"
            title="Expand Seating Legend"
          >
            📋
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-0.5 gap-4">
              <span>3D SEATING LEGEND</span>
              <button
                onClick={() => setIsLegendMinimized(true)}
                className="text-slate-400 hover:text-white text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
                title="Minimize Seating Legend"
              >
                _
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"></span>
              <span>Faculty & VIP (Stage Side)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
              <span>Special Visitors (Floor)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-blue-500 block rounded-sm"></span>
              <span>Graduates (Monoblock Row A)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 block"></span>
              <span>Graduates (District 1)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 block"></span>
              <span>Graduates (District 2)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block"></span>
              <span>Graduates (District 3)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block"></span>
              <span>Graduates (District 4)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 block"></span>
              <span>Graduates (District 5)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 block"></span>
              <span>Graduates (District 6)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
              <span>Parents & Guests</span>
            </div>
            <div className="flex items-center gap-2 border-t border-slate-800 pt-1 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 block"></span>
              <span>Occupied / Unavailable</span>
            </div>
            <div className="flex items-center gap-2 border-t border-slate-800 pt-1 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-900 block"></span>
              <span>Floor Doors (Baseline)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 block"></span>
              <span>Tunnel Portals (Red Enclosures)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
