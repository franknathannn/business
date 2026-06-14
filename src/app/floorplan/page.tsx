import { Metadata } from 'next';
import { FloorplanViewer } from '@/components/floorplan/FloorplanViewer';

export const metadata: Metadata = {
  title: 'San Andres Complex Court - Seating Bowl & Floorplan Viewer',
  description: 'Interactive 2D and 3D floor plan and seating layout viewer of the San Andres Sports Complex basketball court and graduate seating.',
};

export default function FloorplanPage() {
  return (
    <main id="floorplan-main-container">
      <FloorplanViewer />
    </main>
  );
}
