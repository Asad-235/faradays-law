import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MAGNET_WIDTH, MAGNET_HEIGHT, COIL_CENTER_X } from '../constants';

interface SimulationCanvasProps {
  magnetX: number; // -400 to 400
  setMagnetX: (x: number) => void;
  turns: number;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  magnetX,
  setMagnetX,
  turns,
  setIsDragging,
  onDragStart,
  onDragEnd
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragOffset, setDragOffset] = useState(0);

  // Convert simulation coordinate (-400 to 400) to SVG coordinate (0 to 800)
  const screenX = (simX: number) => simX + CANVAS_WIDTH / 2;
  const simXFromScreen = (screenX: number) => screenX - CANVAS_WIDTH / 2;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling on touch
    onDragStart();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const currentMagnetScreenX = screenX(magnetX);
      
      // Check if click is near magnet
      if (Math.abs(clickX - currentMagnetScreenX) < MAGNET_WIDTH / 2 + 50) {
        setIsDragging(true);
        setDragOffset(clickX - currentMagnetScreenX);
      }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const newSimX = simXFromScreen(x - dragOffset);
      
      // Boundary checks
      const maxX = CANVAS_WIDTH / 2 - MAGNET_WIDTH / 2;
      const clampedX = Math.max(-maxX, Math.min(maxX, newSimX));
      
      setMagnetX(clampedX);
    }
  }, [dragOffset, setMagnetX]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    onDragEnd();
  }, [setIsDragging, onDragEnd]);

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => handleMouseMove(e);
    const handleGlobalUp = () => handleMouseUp();

    // Attach listeners conditionally would be cleaner, but for simplicity in dragging outside canvas:
    // We attach to window only when dragging could be active or just always if cheap.
    // Here we attach to window to support dragging outside the SVG bounds.
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  // Generate Coil Path
  const renderCoil = () => {
    const coilRadius = 60;
    const coilWidth = 20 + turns * 8; // Coil gets wider with more turns
    const points = [];
    
    // Front and back loops
    // Drawing a simplified solenoid representation
    const loops = [];
    for (let i = 0; i < turns; i++) {
        const xOffset = -coilWidth/2 + (i * (coilWidth/Math.max(1, turns-1)));
        // Top arc (back)
        loops.push(
            <path
                key={`back-${i}`}
                d={`M ${screenX(COIL_CENTER_X + xOffset)} ${CANVAS_HEIGHT/2 - coilRadius} A 20 60 0 0 1 ${screenX(COIL_CENTER_X + xOffset)} ${CANVAS_HEIGHT/2 + coilRadius}`}
                fill="none"
                stroke="#b45309" // Darker copper
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.6"
            />
        );
    }
    
    // Magnet needs to be sandwiched between back and front arcs
    // to simulate passing through.
    // However, in 2D it's hard to do perfect Z-indexing without 3D engine.
    // Simple approach: Draw back of coil, then magnet, then front of coil.
    
    const frontLoops = [];
    for (let i = 0; i < turns; i++) {
        const xOffset = -coilWidth/2 + (i * (coilWidth/Math.max(1, turns-1)));
         // Bottom arc (front)
         frontLoops.push(
            <path
                key={`front-${i}`}
                d={`M ${screenX(COIL_CENTER_X + xOffset)} ${CANVAS_HEIGHT/2 + coilRadius} A 20 60 0 0 1 ${screenX(COIL_CENTER_X + xOffset)} ${CANVAS_HEIGHT/2 - coilRadius}`}
                fill="none"
                stroke="#f59e0b" // Brighter copper
                strokeWidth="4"
                strokeLinecap="round"
            />
        );
    }

    return { backLoops: loops, frontLoops: frontLoops, width: coilWidth };
  };

  const { backLoops, frontLoops } = renderCoil();

  // Field Lines
  const renderFieldLines = () => {
    // Dynamic field lines based on magnet position
    const lines = [];
    const magnetScreenX = screenX(magnetX);
    const centerY = CANVAS_HEIGHT / 2;
    
    for (let i = 0; i < 3; i++) {
       const scale = 1 + i * 0.5;
       const pathD = `M ${magnetScreenX - MAGNET_WIDTH/2} ${centerY} C ${magnetScreenX - MAGNET_WIDTH*2 * scale} ${centerY - 100 * scale}, ${magnetScreenX + MAGNET_WIDTH*2 * scale} ${centerY - 100 * scale}, ${magnetScreenX + MAGNET_WIDTH/2} ${centerY}`;
       const pathDBottom = `M ${magnetScreenX - MAGNET_WIDTH/2} ${centerY} C ${magnetScreenX - MAGNET_WIDTH*2 * scale} ${centerY + 100 * scale}, ${magnetScreenX + MAGNET_WIDTH*2 * scale} ${centerY + 100 * scale}, ${magnetScreenX + MAGNET_WIDTH/2} ${centerY}`;
       
       lines.push(
         <path key={`top-${i}`} d={pathD} fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="2" strokeDasharray="5,5" />,
         <path key={`bottom-${i}`} d={pathDBottom} fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="2" strokeDasharray="5,5" />
       );
    }
    return lines;
  };

  return (
    <div className="w-full bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-700 relative cursor-crosshair">
       <svg 
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} 
        className="w-full h-auto select-none touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
       >
          {/* Grid/Background Guide */}
          <line x1="0" y1={CANVAS_HEIGHT/2} x2={CANVAS_WIDTH} y2={CANVAS_HEIGHT/2} stroke="#1e293b" strokeWidth="2" />
          <line x1={CANVAS_WIDTH/2} y1="0" x2={CANVAS_WIDTH/2} y2={CANVAS_HEIGHT} stroke="#1e293b" strokeWidth="2" />

          {/* Magnetic Field Lines */}
          <g>{renderFieldLines()}</g>

          {/* Coil Back */}
          <g>{backLoops}</g>

          {/* Magnet */}
          <g transform={`translate(${screenX(magnetX) - MAGNET_WIDTH/2}, ${CANVAS_HEIGHT/2 - MAGNET_HEIGHT/2})`}>
             <rect width={MAGNET_WIDTH/2} height={MAGNET_HEIGHT} fill="#ef4444" rx="4" /> {/* North (Red) usually */}
             <rect x={MAGNET_WIDTH/2} width={MAGNET_WIDTH/2} height={MAGNET_HEIGHT} fill="#3b82f6" rx="4" /> {/* South (Blue) */}
             <text x="15" y="26" fill="white" fontWeight="bold" fontSize="14" fontFamily="sans-serif">S</text>
             <text x={MAGNET_WIDTH - 25} y="26" fill="white" fontWeight="bold" fontSize="14" fontFamily="sans-serif">N</text>
             
             {/* Drag Handle Indicator */}
             <rect x={MAGNET_WIDTH/2 - 20} y="-15" width="40" height="4" fill="rgba(255,255,255,0.5)" rx="2" />
          </g>

          {/* Coil Front */}
          <g>{frontLoops}</g>

          {/* Connection Wires to Galvanometer */}
          <path d={`M ${screenX(COIL_CENTER_X)} ${CANVAS_HEIGHT/2 + 60} L ${screenX(COIL_CENTER_X)} ${CANVAS_HEIGHT}`} stroke="#f59e0b" strokeWidth="4" fill="none" />
       </svg>
       
       <div className="absolute top-4 left-4 text-slate-400 text-sm pointer-events-none select-none">
         <p>Drag magnet left/right</p>
       </div>
    </div>
  );
};
