import React from 'react';
import { MAX_NEEDLE_DEFLECTION } from '../constants';

interface GalvanometerProps {
  value: number; // The generic value to display (EMF)
  label: string;
  unit: string;
  className?: string;
}

export const Galvanometer: React.FC<GalvanometerProps> = ({ value, label, unit, className = '' }) => {
  // Clamp value for visual sanity, though physics might go higher
  const clampedValue = Math.max(-100, Math.min(100, value));
  
  // Convert -100..100 range to -MAX_DEFLECTION..MAX_DEFLECTION degrees
  const angle = (clampedValue / 100) * MAX_NEEDLE_DEFLECTION;

  return (
    <div className={`flex flex-col items-center justify-center bg-gray-800 p-4 rounded-xl shadow-lg border-4 border-gray-700 w-full ${className}`}>
      <div className="relative w-48 h-24 overflow-hidden mb-4 scale-110">
        {/* Gauge Background */}
        <div className="absolute top-0 left-0 w-full h-48 bg-gray-100 rounded-full border-2 border-gray-400 box-border origin-center transform translate-y-0"
             style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}>
           
           {/* Ticks */}
           {[...Array(11)].map((_, i) => {
             const tickAngle = -MAX_NEEDLE_DEFLECTION + (i * (MAX_NEEDLE_DEFLECTION * 2) / 10);
             return (
               <div
                 key={i}
                 className="absolute top-[50%] left-[50%] h-48 w-0.5 bg-gray-400 origin-top -translate-x-1/2"
                 style={{ transform: `rotate(${tickAngle + 180}deg)` }}
               >
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 rotate-180">
                    {/* Tick labels */}
                 </div>
               </div>
             );
           })}
        </div>

        {/* Center Pivot */}
        <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-800 rounded-full -translate-x-1/2 translate-y-1/2 z-20"></div>

        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 h-20 w-1 bg-red-600 origin-bottom -translate-x-1/2 z-10 transition-transform duration-75 ease-out rounded-full"
          style={{ transform: `rotate(${angle}deg)` }}
        ></div>
      </div>
      
      <div className="text-gray-300 font-mono text-2xl font-bold mt-2">
        {value.toFixed(2)} <span className="text-base text-gray-400">{unit}</span>
      </div>
      <div className="text-gray-400 text-sm uppercase tracking-wider font-semibold mt-1">{label}</div>
    </div>
  );
};