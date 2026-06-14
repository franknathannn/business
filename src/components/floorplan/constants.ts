import { Seat, Section, ExitEntrance, Staircase, Point3D, SeatClass } from './types';

// =============================================================================
// COURT DIMENSIONS
// =============================================================================
// Standard basketball court: 94ft x 50ft ≈ 28.65m x 15.24m
// We use arbitrary units. The court's LONG axis runs along X.
export const COURT_LENGTH = 160; // X-axis (landscape)
export const COURT_WIDTH = 90;   // Y-axis (shorter)

// =============================================================================
// CONCRETE BARRIER WALL
// =============================================================================
// Critical architectural feature: A vertical concrete wall/ledge separates the
// bleacher seating bowl from the court floor. There are NO stairs connecting
// the stands to the court. The two levels are completely isolated.
// This wall is the inner face of the octagon, rising from z=0 to z=BARRIER_HEIGHT.
export const BARRIER_HEIGHT = 11; // Increased wall height to match stadium proportions

// =============================================================================
// OCTAGONAL SEATING BOWL GEOMETRY
// =============================================================================
// The interior octagon: long walls run PARALLEL to the court's long axis (X).
// Two long walls on North (+Y) and South (-Y), two short walls on West (-X) and East (+X).
// Four chamfered diagonal corners connect them.
//
// Coordinate system:
//   X = left/right (court's long axis)
//   Y = forward/backward (court's short axis)
//   Z = up (height)

// Inner concrete wall octagon (base of the bleachers) at z = 0
// This is also where the concrete barrier wall sits
export const BOWL_BASE_OCTAGON: Point3D[] = [
  { x: -70, y: -60, z: 0 },   // Bottom-left of south long wall
  { x:  70, y: -60, z: 0 },   // Bottom-right of south long wall
  { x:  95, y: -35, z: 0 },   // SE diagonal → east short wall
  { x:  95, y:  35, z: 0 },   // East short wall → NE diagonal
  { x:  70, y:  60, z: 0 },   // Top-right of north long wall
  { x: -70, y:  60, z: 0 },   // Top-left of north long wall
  { x: -95, y:  35, z: 0 },   // NW diagonal → west short wall
  { x: -95, y: -35, z: 0 }    // West short wall → SW diagonal
];

// Outer concourse octagon (top of bleachers) at z = 45
// Flares outward as seats rise
export const BOWL_TOP_OCTAGON: Point3D[] = [
  { x: -105, y: -100, z: 45 },
  { x:  105, y: -100, z: 45 },
  { x:  135, y:  -65, z: 45 },
  { x:  135, y:   65, z: 45 },
  { x:  105, y:  100, z: 45 },
  { x: -105, y:  100, z: 45 },
  { x: -135, y:   65, z: 45 },
  { x: -135, y:  -65, z: 45 }
];

// =============================================================================
// SECTIONS
// =============================================================================
export const SECTIONS: Section[] = [
  { id: 'north', name: 'North Stand (District 4-6)', seatClass: 'Guest', color: '#8b5cf6', labelPos: { x: 0, y: 100 } },
  { id: 'south', name: 'South Stand (District 1-3)', seatClass: 'Guest', color: '#06b6d4', labelPos: { x: 0, y: -100 } },
  { id: 'west',  name: 'West End (Parents & Guests)', seatClass: 'Reserved', color: '#10b981', labelPos: { x: -120, y: 0 } },
  { id: 'east',  name: 'East End (Graduates)',       seatClass: 'Guest', color: '#3b82f6', labelPos: { x: 120, y: 0 } },
  { id: 'nw',    name: 'North-West (Parents & Guests)', seatClass: 'Reserved', color: '#10b981', labelPos: { x: -90, y: 80 } },
  { id: 'ne',    name: 'North-East (Parents & Guests)',  seatClass: 'Reserved', color: '#10b981', labelPos: { x: 90, y: 80 } },
  { id: 'sw',    name: 'South-West (Parents & Guests)',  seatClass: 'Reserved', color: '#10b981', labelPos: { x: -90, y: -80 } },
  { id: 'se',    name: 'South-East (Parents & Guests)',  seatClass: 'Reserved', color: '#10b981', labelPos: { x: 90, y: -80 } },
  { id: 'vip_floor',     name: 'Special Visitors (Floor)', seatClass: 'Graduate', color: '#f59e0b', labelPos: { x: 0, y: -20 } },
  { id: 'faculty_floor', name: 'Faculty & VIP Row',        seatClass: 'VIP',      color: '#ef4444', labelPos: { x: 0, y: 35 } }
];

// =============================================================================
// FLOOR-LEVEL vs BLEACHER-LEVEL SECTION IDS (for pathfinding)
// =============================================================================
export const FLOOR_LEVEL_SECTIONS = ['vip_floor', 'faculty_floor'];
export const BLEACHER_SECTIONS = ['north', 'south', 'west', 'east', 'nw', 'ne', 'sw', 'se'];

// =============================================================================
// SEAT GENERATION
// =============================================================================
const generateSeats = (): Seat[] => {
  const seats: Seat[] = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; // 8 rows deep
  
  const rowHeightStep = 5.5;   // Z rise per row
  const rowDepthStep = 5.0;    // Outward push per row
  const baseHeight = BARRIER_HEIGHT + 2; // Seats start ABOVE the barrier wall

  // ─────────────────────────────────────────────────────────
  // 1. NORTH STAND (Long wall at +Y side, many seats)
  //    Base Y = 65, flaring out to Y = 105
  //    Seats span X from -60 to +60
  // ─────────────────────────────────────────────────────────
  for (let rIndex = 0; rIndex < rows.length; rIndex++) {
    const row = rows[rIndex];
    const z = baseHeight + rIndex * rowHeightStep;
    const y = 65 + rIndex * rowDepthStep;
    const seatsInRow = 18;
    for (let s = 1; s <= seatsInRow; s++) {
      if (s === 6 || s === 13) continue; // Walkway gaps
      const x = -60 + (s - 1) * (120 / (seatsInRow - 1));
      seats.push({
        id: `north-${row}-${s}`,
        sectionId: 'north',
        row,
        number: s,
        seatClass: 'Guest',
        price: 150,
        pos: { x, y, z },
        facing: -Math.PI / 2,
        status: 'available'
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // 2. SOUTH STAND (Long wall at -Y side, many seats)
  // ─────────────────────────────────────────────────────────
  for (let rIndex = 0; rIndex < rows.length; rIndex++) {
    const row = rows[rIndex];
    const z = baseHeight + rIndex * rowHeightStep;
    const y = -(65 + rIndex * rowDepthStep);
    const seatsInRow = 18;
    for (let s = 1; s <= seatsInRow; s++) {
      if (s === 6 || s === 13) continue; // Walkway gaps
      const x = -60 + (s - 1) * (120 / (seatsInRow - 1));
      seats.push({
        id: `south-${row}-${s}`,
        sectionId: 'south',
        row,
        number: s,
        seatClass: 'Guest',
        price: 150,
        pos: { x, y, z },
        facing: Math.PI / 2,
        status: 'available'
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // 3. WEST END (Short wall at -X side, behind basket - Parents & Guests)
  // ─────────────────────────────────────────────────────────
  for (let rIndex = 0; rIndex < rows.length; rIndex++) {
    const row = rows[rIndex];
    const z = baseHeight + rIndex * rowHeightStep;
    const x = -(100 + rIndex * rowDepthStep);
    const seatsInRow = 8;
    for (let s = 1; s <= seatsInRow; s++) {
      const y = -25 + (s - 1) * (50 / (seatsInRow - 1));
      seats.push({
        id: `west-${row}-${s}`,
        sectionId: 'west',
        row,
        number: s,
        seatClass: 'Reserved',
        price: 200,
        pos: { x, y, z },
        facing: 0,
        status: 'available'
      });
    }
  }

  // East stand is omitted because stage is located at the East end.

  // ─────────────────────────────────────────────────────────
  // 5. CORNER DIAGONALS (Chamfered corners, 7 rows, 6 seats)
  //    Leave a central gap for the corner staircases and portals
  // ─────────────────────────────────────────────────────────
  const cornerAngles = {
    nw: { angle: -Math.PI / 4,       cx: -82, cy:  47, sx: -1, sy:  1 },
    sw: { angle:  Math.PI / 4,       cx: -82, cy: -47, sx: -1, sy: -1 }
  };

  Object.entries(cornerAngles).forEach(([sectionId, config]) => {
    for (let rIndex = 0; rIndex < rows.length - 1; rIndex++) {
      const row = rows[rIndex];
      const z = baseHeight + rIndex * rowHeightStep;
      
      const rDist = rIndex * rowDepthStep;
      const seatsInRow = 6;
      for (let s = 1; s <= seatsInRow; s++) {
        // Skip middle seats to leave space for diagonal staircase/tunnel portals
        if (s === 3 || s === 4) continue;
        const theta = config.angle + ((s - (seatsInRow + 1) / 2) * 0.24);
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        
        const bx = config.cx + config.sx * rDist * 0.707;
        const by = config.cy + config.sy * rDist * 0.707;
        
        seats.push({
          id: `${sectionId}-${row}-${s}`,
          sectionId,
          row,
          number: s,
          seatClass: 'Reserved',
          price: 200,
          pos: {
            x: bx + (s - (seatsInRow + 1) / 2) * 6 * -sin,
            y: by + (s - (seatsInRow + 1) / 2) * 6 * cos,
            z
          },
          facing: theta + Math.PI,
          status: 'available'
        });
      }
    }
  });

  // ─────────────────────────────────────────────────────────
  // 6. GRADUATE SEATING (Floor-level monobloc chairs)
  //    These sit ON the court floor (z = 0.5), completely
  //    isolated from the bleachers by the concrete barrier.
  //    Stage is on the EAST end of the floor (x = 76).
  // ─────────────────────────────────────────────────────────
  const gradRows = ['G-A', 'G-B', 'G-C', 'G-D', 'G-E', 'G-F', 'G-G', 'G-H', 'G-I'];
  for (let r = 0; r < gradRows.length; r++) {
    const row = gradRows[r];
    const x = 55 - r * 10;
    const seatsInRow = 12;
    for (let s = 1; s <= seatsInRow; s++) {
      if (s === 6 || s === 7) continue; // Center aisle
      const y = -35 + (s - 1) * (70 / (seatsInRow - 1));
      seats.push({
        id: `vip-floor-${row}-${s}`,
        sectionId: 'vip_floor',
        row,
        number: s,
        seatClass: 'Graduate',
        price: 250,
        pos: { x, y, z: 0.5 },
        facing: 0,
        status: 'available'
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // 7. FACULTY & VIP ROW (Floor-level, in front of stage)
  // ─────────────────────────────────────────────────────────
  const facSeatsCount = 10;
  for (let s = 1; s <= facSeatsCount; s++) {
    const y = -25 + (s - 1) * (50 / (facSeatsCount - 1));
    seats.push({
      id: `faculty-floor-VIP-Row-${s}`,
      sectionId: 'faculty_floor',
      row: 'VIP',
      number: s,
      seatClass: 'VIP',
      price: 500,
      pos: { x: 68, y, z: 0.5 },
      facing: 0,
      status: 'available'
    });
  }

  return seats;
};

export const SEATS = generateSeats();

// =============================================================================
// EXITS & ENTRANCES — "Two-Per-Side" Dual-Level System (8 Portals)
// =============================================================================
//
// Each of the 4 main sides features a STACKED PAIR:
//
//   ┌─────────────────────────────────────┐
//   │  UPPER: Bleacher Tunnel Portal      │  z = 45 (concourse level)
//   │  (Concrete tunnel cutting through   │
//   │   the blue seating rows)            │
//   ├─────────────────────────────────────┤
//   │  LOWER: Floor Door                  │  z = 0 (court level)
//   │  (Brown wooden door with green      │
//   │   EXIT sign, in the gray wall)      │
//   └─────────────────────────────────────┘
//
// PATHFINDING RULES:
//   • Bleacher spectators → ONLY upper tunnel portals (cannot jump down)
//   • Court-level people  → ONLY lower floor doors (cannot climb barrier)

export const EXITS_ENTRANCES: ExitEntrance[] = [
  // ── NORTH-WEST DIAGONAL ──
  { id: 'floor_nw',  name: 'NW Floor Door',       type: 'both', pos: { x: -82.5, y:  47.5, z: 0 },  width: 5, facing: -Math.PI / 4 },
  { id: 'tunnel_nw', name: 'NW Tunnel Portal',    type: 'both', pos: { x: -82.5, y:  47.5, z: BARRIER_HEIGHT }, width: 12, facing: -Math.PI / 4 },

  // ── NORTH-EAST DIAGONAL ──
  { id: 'floor_ne',  name: 'NE Floor Door',       type: 'both', pos: { x:  82.5, y:  47.5, z: 0 },  width: 5, facing: -3 * Math.PI / 4 },
  { id: 'tunnel_ne', name: 'NE Tunnel Portal',    type: 'both', pos: { x:  82.5, y:  47.5, z: BARRIER_HEIGHT }, width: 12, facing: -3 * Math.PI / 4 },

  // ── SOUTH-WEST DIAGONAL ──
  { id: 'floor_sw',  name: 'SW Floor Door',       type: 'both', pos: { x: -82.5, y: -47.5, z: 0 },  width: 5, facing: Math.PI / 4 },
  { id: 'tunnel_sw', name: 'SW Tunnel Portal',    type: 'both', pos: { x: -82.5, y: -47.5, z: BARRIER_HEIGHT }, width: 12, facing: Math.PI / 4 },

  // ── SOUTH-EAST DIAGONAL ──
  { id: 'floor_se',  name: 'SE Floor Door',       type: 'both', pos: { x:  82.5, y: -47.5, z: 0 },  width: 5, facing: 3 * Math.PI / 4 },
  { id: 'tunnel_se', name: 'SE Tunnel Portal',    type: 'both', pos: { x:  82.5, y: -47.5, z: BARRIER_HEIGHT }, width: 12, facing: 3 * Math.PI / 4 }
];

// =============================================================================
// STAIRCASES (Bleacher-Level ONLY)
// =============================================================================
// Stairs run WITHIN the seating bowl, from the front row (z = BARRIER_HEIGHT)
// up to the tunnel portals at the top (z = 45) in the diagonal corners.

export const STAIRCASES: Staircase[] = [
  { id: 'stair_nw', sectionId: 'nw', posStart: { x: -82.5, y:  47.5, z: BARRIER_HEIGHT }, posEnd: { x: -120,  y:  82.5, z: 45 } },
  { id: 'stair_ne', sectionId: 'ne', posStart: { x:  82.5, y:  47.5, z: BARRIER_HEIGHT }, posEnd: { x:  120,  y:  82.5, z: 45 } },
  { id: 'stair_sw', sectionId: 'sw', posStart: { x: -82.5, y: -47.5, z: BARRIER_HEIGHT }, posEnd: { x: -120,  y: -82.5, z: 45 } },
  { id: 'stair_se', sectionId: 'se', posStart: { x:  82.5, y: -47.5, z: BARRIER_HEIGHT }, posEnd: { x:  120,  y: -82.5, z: 45 } }
];

// =============================================================================
// STAGE
// =============================================================================
// Sits against the EAST short wall on the court floor.
export const STAGE = {
  x: 76,              // Sits against the East retaining wall (x = 95)
  y: -35,             // Centered around y = 0
  width: 16,          // Depth from the wall
  depth: 70,          // Width along the wall
  height: 4,
  label: 'MAIN STAGE'
};
