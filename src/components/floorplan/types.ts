export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type SeatClass = 'VIP' | 'Graduate' | 'Guest' | 'Faculty' | 'Reserved';

export interface Seat {
  id: string;
  sectionId: string;
  row: string;
  number: number;
  seatClass: SeatClass;
  price: number;
  // 3D position
  pos: Point3D;
  // Direction the seat is facing in 3D (yaw in radians)
  facing: number;
  status: 'available' | 'occupied' | 'selected';
}

export interface Section {
  id: string;
  name: string;
  seatClass: SeatClass;
  color: string;
  // 2D center position for label
  labelPos: { x: number; y: number };
}

export interface ExitEntrance {
  id: string;
  name: string;
  type: 'exit' | 'entrance' | 'both';
  pos: Point3D;
  // Width and direction for drawing
  width: number;
  facing: number;
}

export interface Staircase {
  id: string;
  sectionId: string;
  posStart: Point3D;
  posEnd: Point3D;
}
