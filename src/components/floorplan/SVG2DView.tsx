'use client';

import React, { useState, useRef, MouseEvent, WheelEvent } from 'react';
import { Seat, ExitEntrance, Staircase } from './types';
import { COURT_LENGTH, COURT_WIDTH, BOWL_BASE_OCTAGON, BOWL_TOP_OCTAGON, STAGE, EXITS_ENTRANCES, STAIRCASES } from './constants';

interface SVG2DViewProps {
  seats: Seat[];
  onSeatHover: (seat: Seat | null) => void;
  onSeatSelect: (seat: Seat | null) => void;
  selectedSeat: Seat | null;
  hoveredSeat: Seat | null;
  showNames: boolean;
  onShowNamesChange: (val: boolean) => void;
}

export const SVG2DView: React.FC<SVG2DViewProps> = ({
  seats,
  onSeatHover,
  onSeatSelect,
  selectedSeat,
  hoveredSeat,
  showNames,
  onShowNamesChange
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  
  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPan = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Size of coordinate system
  const width = 450;
  const height = 450;
  const viewWidth = width / zoom;
  const viewHeight = height / zoom;
  
  // Calculate viewBox
  const minX = -width / 2 + pan.x;
  const minY = -height / 2 + pan.y;
  const viewBoxString = `${minX} ${minY} ${viewWidth} ${viewHeight}`;

  // Drag handlers for panning
  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    // Only pan if we are clicking the background, not a seat
    const target = e.target as SVGElement;
    if (target.tagName === 'circle' && target.getAttribute('data-seat-id')) {
      return;
    }
    setIsPanning(true);
    startPan.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      const dx = e.clientX - startPan.current.x;
      const dy = e.clientY - startPan.current.y;
      // Scale movement by zoom factor
      setPan(prev => ({
        x: prev.x - dx / zoom,
        y: prev.y - dy / zoom
      }));
      startPan.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(5, prev * zoomFactor));
    } else {
      setZoom(prev => Math.max(0.6, prev / zoomFactor));
    }
  };

  // Find the exit route coordinates for a selected seat
  const getExitRoutePoints = (seat: Seat): { x: number; y: number }[] | null => {
    const isFloorSeat = seat.sectionId === 'vip_floor' || seat.sectionId === 'faculty_floor';

    if (isFloorSeat) {
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

      return [
        { x: seat.pos.x, y: seat.pos.y },
        { x: closestExit.pos.x * 0.85, y: closestExit.pos.y * 0.85 },
        { x: closestExit.pos.x, y: closestExit.pos.y }
      ];
    } else {
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

      const tunnelExits = EXITS_ENTRANCES.filter(gate => gate.id.startsWith('tunnel'));
      let closestExit: ExitEntrance | null = null;
      let minExitDist = Infinity;
      for (const gate of tunnelExits) {
        const dist = Math.hypot(gate.pos.x - closestStair!.posEnd.x, gate.pos.y - closestStair!.posEnd.y);
        if (dist < minExitDist) {
          minExitDist = dist;
          closestExit = gate;
        }
      }

      if (!closestExit) return null;

      const hDiff = closestStair.posEnd.z - closestStair.posStart.z;
      const pct = (seat.pos.z - closestStair.posStart.z) / hDiff;
      const stairRowPt = {
        x: closestStair.posStart.x + (closestStair.posEnd.x - closestStair.posStart.x) * pct,
        y: closestStair.posStart.y + (closestStair.posEnd.y - closestStair.posStart.y) * pct
      };

      return [
        { x: seat.pos.x, y: seat.pos.y },
        stairRowPt,
        { x: closestExit.pos.x, y: closestExit.pos.y }
      ];
    }
  };

  const routePoints = selectedSeat ? getExitRoutePoints(selectedSeat) : null;

  return (
    <div className="relative w-full h-[550px] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center select-none">
      <svg
        ref={svgRef}
        viewBox={viewBoxString}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Floor Base */}
        <rect x="-220" y="-220" width="440" height="440" fill="#0f172a" />
        
        {/* Outer Boundary Wall (Stretched Octagon) */}
        <polygon
          points={BOWL_TOP_OCTAGON.map(p => `${p.x},${p.y}`).join(' ')}
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="3"
        />

        {/* Inner Seating Base Wall (Concrete Octagon) */}
        <polygon
          points={BOWL_BASE_OCTAGON.map(p => `${p.x},${p.y}`).join(' ')}
          fill="#0f172a"
          stroke="#64748b" // Concrete gray wall
          strokeWidth="3.5"
        />

        {/* Basketball Court Floor */}
        <rect
          x={-COURT_LENGTH/2}
          y={-COURT_WIDTH/2}
          width={COURT_LENGTH}
          height={COURT_WIDTH}
          fill="#78350f" // Wooden court color
          stroke="#fbbf24"
          strokeWidth="1.5"
        />
        
        {/* Court Markings */}
        {/* Center line */}
        <line x1="0" y1={-COURT_WIDTH/2} x2="0" y2={COURT_WIDTH/2} stroke="#fbbf24" strokeWidth="1" />
        {/* Center circle */}
        <circle cx="0" cy="0" r="12" fill="none" stroke="#fbbf24" strokeWidth="1" />
        {/* Three point lines */}
        <path d={`M ${COURT_LENGTH/2} -22 A 45 45 0 0 0 ${COURT_LENGTH/2} 22`} fill="none" stroke="#fbbf24" strokeWidth="1" />
        <path d={`M ${-COURT_LENGTH/2} -22 A 45 45 0 0 1 ${-COURT_LENGTH/2} 22`} fill="none" stroke="#fbbf24" strokeWidth="1" />
        
        {/* Stairs */}
        {STAIRCASES.map(stair => (
          <line
            key={stair.id}
            x1={stair.posStart.x}
            y1={stair.posStart.y}
            x2={stair.posEnd.x}
            y2={stair.posEnd.y}
            stroke="#fbbf24"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        ))}

        {/* Stage */}
        <rect
          x={STAGE.x}
          y={STAGE.y}
          width={STAGE.width}
          height={STAGE.depth}
          fill="#475569"
          stroke="#94a3b8"
          strokeWidth="1.5"
          rx="1"
        />
        <text
          x={STAGE.x + STAGE.width / 2}
          y={STAGE.y + STAGE.depth / 2}
          fill="#ffffff"
          fontSize="7"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="central"
          transform={`rotate(-90, ${STAGE.x + STAGE.width / 2}, ${STAGE.y + STAGE.depth / 2})`}
        >
          {STAGE.label}
        </text>



        {/* Exits & Gate Indicators */}
        {EXITS_ENTRANCES.map(gate => {
          const isFloorDoor = gate.pos.z < 5;
          return (
            <g key={gate.id} transform={`translate(${gate.pos.x}, ${gate.pos.y})`}>
              {isFloorDoor ? (
                <>
                  {/* Floor-level door: brown rectangle with EXIT sign */}
                  <rect x="-5" y="-3" width="10" height="6" fill="#78350f" stroke="#92400e" strokeWidth="1" rx="1" />
                  <text
                    x="0"
                    y="-6"
                    fill="#22c55e"
                    fontSize="5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    EXIT
                  </text>
                </>
              ) : (
                <>
                  {/* Tunnel portal: red highlighted enclosure */}
                  <rect x="-7" y="-4" width="14" height="8" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" rx="1" />
                  <text
                    x="0"
                    y="-7"
                    fill="#f87171"
                    fontSize="4.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    EXIT PORTAL
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Highlight Exit Route if selected */}
        {routePoints && routePoints.length > 0 && (
          <g>
            <path
              d={routePoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
            {/* Blinking animated dot along path */}
            <circle cx={routePoints[0].x} cy={routePoints[0].y} r="5" fill="#ef4444" opacity="0.8">
              <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Seats */}
        {seats.map(seat => {
          const isHovered = hoveredSeat?.id === seat.id;
          const isSelected = selectedSeat?.id === seat.id;
          
          let color = '#3b82f6';
          if (seat.seatClass === 'VIP') color = '#ef4444';
          else if (seat.seatClass === 'Graduate') color = '#fbbf24';
          else if (seat.seatClass === 'Reserved') color = '#10b981';

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
            color = '#475569';
          }

          const radius = isSelected ? 5.5 : isHovered ? 4.5 : 2.5;

          const isMonoblock = seat.row === 'A' && ['north', 'south', 'west', 'east', 'nw', 'ne', 'sw', 'se'].includes(seat.sectionId);

          if (isMonoblock) {
            const size = radius * 2.0;
            return (
              <rect
                key={seat.id}
                x={seat.pos.x - size / 2}
                y={seat.pos.y - size / 2}
                width={size}
                height={size}
                fill={color}
                stroke={isSelected ? '#ffffff' : isHovered ? '#ffffff' : 'none'}
                strokeWidth={isSelected ? 1.5 : isHovered ? 1.0 : 0}
                className="transition-all duration-150 cursor-pointer"
                data-seat-id={seat.id}
                onClick={() => onSeatSelect(seat)}
                onMouseEnter={() => onSeatHover(seat)}
                onMouseLeave={() => onSeatHover(null)}
                opacity={seat.status === 'occupied' && !isSelected && !isHovered ? 0.45 : 1}
                rx="0.5"
              />
            );
          }

          return (
            <circle
              key={seat.id}
              cx={seat.pos.x}
              cy={seat.pos.y}
              r={radius}
              fill={color}
              stroke={isSelected ? '#ffffff' : isHovered ? '#ffffff' : 'none'}
              strokeWidth={isSelected ? 1.5 : isHovered ? 1.0 : 0}
              className="transition-all duration-150 cursor-pointer"
              data-seat-id={seat.id}
              onClick={() => onSeatSelect(seat)}
              onMouseEnter={() => onSeatHover(seat)}
              onMouseLeave={() => onSeatHover(null)}
              opacity={seat.status === 'occupied' && !isSelected && !isHovered ? 0.45 : 1}
            />
          );
        })}

        {/* Stand & District Labels (Rendered at the end of the SVG to float on top of seats, only when showNames is ON) */}
        {showNames && (
          <g style={{ pointerEvents: 'none' }}>
            {/* South Stand: Districts 1, 2, 3 */}
            <text x="-40" y="-105" fill="#06b6d4" fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">DISTRICT 1</text>
            <text x="0" y="-105" fill="#0ea5e9" fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">DISTRICT 2</text>
            <text x="40" y="-105" fill="#3b82f6" fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">DISTRICT 3</text>

            {/* North Stand: Districts 4, 5, 6 */}
            <text x="-40" y="105" fill="#6366f1" fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">DISTRICT 4</text>
            <text x="0" y="105" fill="#8b5cf6" fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">DISTRICT 5</text>
            <text x="40" y="105" fill="#d946ef" fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">DISTRICT 6</text>

            {/* Parents & Guests */}
            <text x="-125" y="0" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">PARENTS & GUESTS</text>
          </g>
        )}
      </svg>

      {/* Floating 2D Help Info */}
      <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-sm px-3 py-2 rounded-lg text-[10px] text-slate-400 pointer-events-none">
        <p>• Click & Drag background to Pan</p>
        <p>• Scroll Wheel to Zoom In / Out</p>
        <p>• Hover over seats to view details</p>
      </div>

      {/* 2D Seating Legend Overlay */}
      <div className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-md border border-slate-800 px-3 py-2.5 rounded-xl text-[10px] text-slate-300 flex flex-col gap-1.5 shadow-lg select-none">
        <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-0.5">2D SEATING LEGEND</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"></span>
          <span>Faculty & VIP (Stage)</span>
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
        <div className="flex items-center gap-2 border-t border-slate-800 pt-1 mt-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
          <span>Parents & Guests</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600 block"></span>
          <span>Occupied</span>
        </div>
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
    </div>
  );
};
