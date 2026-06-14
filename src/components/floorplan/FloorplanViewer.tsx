'use client';

import React, { useState, useMemo } from 'react';
import { Seat, SeatClass, Section } from './types';
import { SEATS, SECTIONS, EXITS_ENTRANCES, STAIRCASES } from './constants';
import { Canvas3DView } from './Canvas3DView';
import { SVG2DView } from './SVG2DView';
import { Search, Info, ShieldAlert, Sparkles, Navigation, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const FloorplanViewer: React.FC = () => {
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [localSeats, setLocalSeats] = useState<Seat[]>(SEATS);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  
  // Filtering state
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [seatClassFilter, setSeatClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Statistics
  const stats = useMemo(() => {
    const visualGraduates = localSeats.filter(s => s.seatClass === 'Guest').length;
    const scaleFactor = visualGraduates > 0 ? 1872 / visualGraduates : 1;

    const total = Math.round(localSeats.length * scaleFactor);
    const occupied = Math.round(localSeats.filter(s => s.status === 'occupied').length * scaleFactor);
    const available = total - occupied;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    
    // Count per class (scaled)
    const vip = Math.round(localSeats.filter(s => s.seatClass === 'VIP').length * scaleFactor);
    const graduate = Math.round(localSeats.filter(s => s.seatClass === 'Graduate').length * scaleFactor);
    const guest = 1872; // Exact student capacity requested
    const reserved = Math.round(localSeats.filter(s => s.seatClass === 'Reserved').length * scaleFactor);

    return { total, occupied, available, occupancyRate, vip, graduate, guest, reserved };
  }, [localSeats]);

  // Section names map for fast lookup
  const sectionMap = useMemo(() => {
    return SECTIONS.reduce((acc, sec) => {
      acc[sec.id] = sec;
      return acc;
    }, {} as Record<string, Section>);
  }, []);

  // Filtered seats for rendering
  const filteredSeats = useMemo(() => {
    return localSeats.map(seat => {
      // Find if seat matches search
      const matchesSearch = searchQuery 
        ? seat.id.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesSection = selectedSection === 'all' || seat.sectionId === selectedSection;
      const matchesClass = seatClassFilter === 'all' || seat.seatClass === seatClassFilter;
      const matchesStatus = statusFilter === 'all' || seat.status === statusFilter;

      // We still render all seats, but we can dim or mark out-of-filter seats
      // Let's modify the status of seats out of filter so the renderers can dim them
      if (matchesSearch && matchesSection && matchesClass && matchesStatus) {
        return seat;
      } else {
        // Mock non-matching seats as 'occupied' with a custom dimming flag (or we can filter them completely)
        // For 3D view it is better to render them as occupied/greyed so the physical geometry remains intact.
        return {
          ...seat,
          status: 'occupied' as const // Grey out filtered out seats
        };
      }
    });
  }, [localSeats, selectedSection, seatClassFilter, statusFilter, searchQuery]);

  // Get details for the seat to display
  const activeSeat = hoveredSeat || selectedSeat;

  // Find nearest exit for the active seat
  const nearestExitInfo = useMemo(() => {
    if (!activeSeat) return null;

    let closestStair = STAIRCASES.find(s => s.sectionId === activeSeat.sectionId);
    if (!closestStair) {
      let minDist = Infinity;
      STAIRCASES.forEach(stair => {
        const dist = Math.hypot(stair.posStart.x - activeSeat.pos.x, stair.posStart.y - activeSeat.pos.y);
        if (dist < minDist) {
          minDist = dist;
          closestStair = stair;
        }
      });
    }

    let closestExit = EXITS_ENTRANCES[0];
    let minExitDist = Infinity;
    EXITS_ENTRANCES.forEach(gate => {
      const dStart = Math.hypot(gate.pos.x - closestStair!.posStart.x, gate.pos.y - closestStair!.posStart.y);
      const dEnd = Math.hypot(gate.pos.x - closestStair!.posEnd.x, gate.pos.y - closestStair!.posEnd.y);
      const dist = Math.min(dStart, dEnd);
      if (dist < minExitDist) {
        minExitDist = dist;
        closestExit = gate;
      }
    });

    // Approximate distance in meters (1 unit = 0.5 meters)
    const distanceMeters = Math.round(minExitDist * 0.5);

    return {
      exit: closestExit,
      distance: distanceMeters
    };
  }, [activeSeat]);

  // Toggle seat status (Management action)
  const toggleSeatBooking = () => {
    if (!selectedSeat) return;
    
    const targetStatus: 'available' | 'occupied' = selectedSeat.status === 'occupied' ? 'available' : 'occupied';
    
    setLocalSeats(prev => prev.map(s => {
      if (s.id === selectedSeat.id) {
        const updated: Seat = { ...s, status: targetStatus };
        // Sync selected seat state
        setSelectedSeat(updated);
        return updated;
      }
      return s;
    }));

    toast.success(`Seat ${selectedSeat.id.toUpperCase()} marked as ${targetStatus.toUpperCase()}`);
  };

  // Find a seat via search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = localSeats.find(s => s.id.toLowerCase() === searchQuery.toLowerCase());
    if (found) {
      setSelectedSeat(found);
      toast.success(`Found and centered on Seat ${found.id.toUpperCase()}`);
    } else {
      toast.error(`Seat "${searchQuery}" not found. Try e.g. "north-A-1"`);
    }
  };

  // Names labels visibility
  const [showNames, setShowNames] = useState<boolean>(true);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-16">
      {/* Header Banner */}
      <div className="w-full bg-slate-900 border-b border-slate-800 px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-500 bg-amber-950/40 rounded-full border border-amber-900/50 uppercase">Venue Layout</span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs">San Andres Sports Complex</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 text-slate-100 font-display">
            Graduation Floor Plan & Seating Manager
          </h1>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('3D')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === '3D'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3D Interactive Bowl
          </button>
          <button
            onClick={() => setViewMode('2D')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === '2D'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2D Flat Blueprint
          </button>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Left Side: Viewer (Top) and Inspector/Portals (Bottom) - Cols 1-9 */}
        <div className="lg:col-span-9 flex flex-col gap-8">
          
          {/* Viewer Info Bar */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 px-1 font-medium tracking-wide">
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              {viewMode === '3D' 
                ? 'Rotate 3D model using drag controls to inspect the octagon shape. Use TOP button for birds-eye view.'
                : 'Click and drag blueprint to pan. Scroll to zoom.'}
            </span>
          </div>

          {/* Interactive Screen Viewports */}
          {viewMode === '3D' ? (
            <Canvas3DView
              seats={filteredSeats}
              onSeatHover={setHoveredSeat}
              onSeatSelect={setSelectedSeat}
              selectedSeat={selectedSeat}
              hoveredSeat={hoveredSeat}
              showNames={showNames}
              onShowNamesChange={setShowNames}
            />
          ) : (
            <SVG2DView
              seats={filteredSeats}
              onSeatHover={setHoveredSeat}
              onSeatSelect={setSelectedSeat}
              selectedSeat={selectedSeat}
              hoveredSeat={hoveredSeat}
              showNames={showNames}
              onShowNamesChange={setShowNames}
            />
          )}

          {/* Sub-grid below the viewer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Seat Inspector Detail Card */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-7 shadow-xl flex flex-col justify-between min-h-[350px]">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-5 tracking-widest uppercase">Seat Inspector</h3>
                
                {activeSeat ? (
                  <div className="flex flex-col gap-5">
                    
                    {/* Seat Identifier Label */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Selected Seat Code</span>
                        <span className="text-xl font-black text-white tracking-widest block mt-0.5">{activeSeat.id.toUpperCase()}</span>
                      </div>
                      
                      {/* Status Badge */}
                      <div>
                        {activeSeat.status === 'available' ? (
                          <span className="px-3 py-1.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 rounded-full flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" /> AVAILABLE
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 bg-slate-900/50 border border-slate-800 rounded-full flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" /> OCCUPIED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Seat Specifications */}
                    <div className="space-y-3.5 text-sm text-slate-300 font-medium">
                      <div className="flex justify-between border-b border-slate-800/60 pb-2.5">
                        <span className="text-slate-500">Stand / Section:</span>
                        <span className="font-semibold text-slate-200">{sectionMap[activeSeat.sectionId]?.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-2.5">
                        <span className="text-slate-500">Row Level:</span>
                        <span className="font-semibold text-slate-200">Row {activeSeat.row}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-2.5">
                        <span className="text-slate-500">Seat Number:</span>
                        <span className="font-semibold text-slate-200">Seat #{activeSeat.number}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-2.5">
                        <span className="text-slate-500">Ticket Class:</span>
                        <span className={`font-bold ${
                          activeSeat.seatClass === 'VIP' ? 'text-red-400' :
                          activeSeat.seatClass === 'Graduate' ? 'text-amber-400' :
                          activeSeat.seatClass === 'Reserved' ? 'text-emerald-400' : 'text-blue-400'
                        }`}>{activeSeat.seatClass}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-2.5">
                        <span className="text-slate-500">Estimated Price:</span>
                        <span className="font-extrabold text-slate-100">PHP {activeSeat.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-3">
                    <span className="text-4xl">💺</span>
                    <p className="text-xs max-w-[240px] leading-relaxed">
                      Hover over or click a seat in either 2D or 3D view to inspect coordinates, class, availability, and nearest escape paths.
                    </p>
                  </div>
                )}
              </div>

              {/* Manager Mock Button */}
              {selectedSeat && (
                <div className="mt-8 border-t border-slate-800 pt-5">
                  <button
                    onClick={toggleSeatBooking}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-md cursor-pointer ${
                      selectedSeat.status === 'occupied'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    {selectedSeat.status === 'occupied' 
                      ? 'Release Seat (Make Available)' 
                      : 'Block / Reserve Selected Seat'}
                  </button>
                </div>
              )}
            </div>

            {/* Safety Guide & Portals */}
            <div className="flex flex-col gap-6">
              
              {/* Escape Pathfinding (Visible when seat is selected) */}
              {activeSeat && nearestExitInfo ? (
                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500 mb-2.5 uppercase tracking-wider">
                    <Navigation className="w-4 h-4" /> Safety & Exit Guide
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Guidance path displays a walking route downwards through stairways to the nearest exit portal.
                  </p>
                  <div className="space-y-2.5 text-xs text-slate-300 font-medium">
                    <div className="flex justify-between border-b border-slate-800/60 pb-2">
                      <span className="text-slate-500">Nearest Gate:</span>
                      <span className="font-bold text-emerald-400">{nearestExitInfo.exit.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Walk Distance:</span>
                      <span className="font-bold text-slate-200">~{nearestExitInfo.distance} meters</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex items-start gap-4 text-xs text-slate-400 leading-relaxed">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-200 mb-1 tracking-wide">Geometric Architecture: The Inverted Octagonal Frustum</p>
                    <p>
                      San Andres Sports Complex features an octagonal interior seating bowl wrapping around a flat rectangular basketball court base. The blue guest stands ascend and flare outward at roughly 35° towards the roof trusses, forming an inverted, multi-sided pyramidal frustum.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Exit list */}
              <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl flex-1">
                <h3 className="text-xs font-semibold text-slate-400 mb-4 tracking-widest uppercase flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  Emergency Portals ({EXITS_ENTRANCES.length})
                </h3>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {EXITS_ENTRANCES.map(gate => {
                    const isFloorDoor = gate.pos.z < 5;
                    return (
                      <div key={gate.id} className="flex justify-between items-center text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 font-medium">
                        <span className="text-slate-300">{gate.name}</span>
                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                          isFloorDoor 
                            ? 'text-amber-400 bg-amber-950/20 border border-amber-900/30'
                            : 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/30'
                        }`}>
                          {isFloorDoor ? 'Floor' : 'Tunnel'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
          
        </div>

        {/* Right Side: Filters (Top) and Statistics (Bottom) - Cols 10-12 */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          
          {/* Filters Card */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-7 shadow-xl flex flex-col">
            <h3 className="text-xs font-semibold text-slate-400 mb-5 tracking-widest uppercase">Interactive Filters</h3>
            
            <div className="flex flex-col gap-6">
              {/* Search */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search seat code (e.g. north-A-1)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-sm px-4 py-3 rounded-xl transition-colors outline-none font-medium placeholder-slate-600"
                  style={{ paddingLeft: '2.75rem' }}
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-[14px]" />
              </form>

              {/* Section Select */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-semibold tracking-wider text-slate-400">Stands / Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm p-3.5 rounded-xl outline-none cursor-pointer focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Sections</option>
                  {SECTIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Class Select */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-semibold tracking-wider text-slate-400">Seat Class</label>
                <select
                  value={seatClassFilter}
                  onChange={(e) => setSeatClassFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm p-3.5 rounded-xl outline-none cursor-pointer focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Classes</option>
                  <option value="VIP">VIP & Faculty</option>
                  <option value="Graduate">Special Visitors (Floor)</option>
                  <option value="Guest">Graduates (Bleachers)</option>
                  <option value="Reserved">Parents & Guests</option>
                </select>
              </div>

              {/* Status Select */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-semibold tracking-wider text-slate-400">Availability</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm p-3.5 rounded-xl outline-none cursor-pointer focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Seats</option>
                  <option value="available">Available Only</option>
                  <option value="occupied">Occupied / Blocked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-7 shadow-xl flex flex-col">
            <h3 className="text-xs font-semibold text-slate-400 mb-5 tracking-widest uppercase">Stadium Statistics</h3>
            
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-xs text-slate-500 font-medium tracking-wide">Total Seating Capacity</span>
                <p className="text-4xl font-extrabold text-white mt-1 tracking-tight">{stats.total}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-5">
                <div>
                  <span className="text-xs text-slate-500 font-medium tracking-wide">Available</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-base font-bold text-emerald-400">{stats.available}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium tracking-wide">Occupied</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                    <span className="text-base font-bold text-slate-300">{stats.occupied}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-5">
                <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium tracking-wide">
                  <span>Occupancy Rate</span>
                  <span>{stats.occupancyRate}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stats.occupancyRate}%` }}
                  />
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-5 flex flex-col gap-2.5 text-xs text-slate-400 font-medium tracking-wide">
                <div className="flex justify-between">
                  <span>Faculty & VIP:</span>
                  <span className="font-bold text-red-400">{stats.vip}</span>
                </div>
                <div className="flex justify-between">
                  <span>Special Visitors (Floor):</span>
                  <span className="font-bold text-amber-400">{stats.graduate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Graduates (Bleachers):</span>
                  <span className="font-bold text-blue-400">{stats.guest}</span>
                </div>
                <div className="flex justify-between">
                  <span>Parents & Guests:</span>
                  <span className="font-bold text-emerald-400">{stats.reserved}</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};
