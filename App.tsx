import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { Galvanometer } from './components/Galvanometer';
import { Chart } from './components/Chart';
import { FLUX_SCALE, FLUX_WIDTH_PARAM, EMF_SMOOTHING } from './constants';
import { Play, Pause, RefreshCw, Settings2 } from 'lucide-react';

const MAX_HISTORY = 50;

const App: React.FC = () => {
  // Simulation State
  const [magnetX, setMagnetX] = useState(0);
  const [turns, setTurns] = useState(5);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [oscillationSpeed, setOscillationSpeed] = useState(1);

  // Physics State (Refs for performance in animation loop)
  const lastTimeRef = useRef(performance.now());
  const lastXRef = useRef(0);
  const velocityRef = useRef(0);
  
  // Display State
  const [displayEMF, setDisplayEMF] = useState(0);
  const [displayFlux, setDisplayFlux] = useState(0);
  const [displayVelocity, setDisplayVelocity] = useState(0);
  
  // History for Chart
  const [history, setHistory] = useState<{time: number, flux: number, emf: number}[]>([]);
  const frameCountRef = useRef(0);

  // Physics Engine Step
  const updatePhysics = useCallback((currentTime: number) => {
    const dt = (currentTime - lastTimeRef.current) / 1000; // seconds
    if (dt <= 0) return;

    let currentX = magnetX;

    // Auto Oscillation Logic
    if (isPlaying && !isDragging) {
      const omega = oscillationSpeed * 2;
      currentX = 300 * Math.sin(currentTime * 0.001 * omega);
      setMagnetX(currentX);
    }

    // Velocity Calculation (px/s)
    // If user just dragged, raw velocity can be noisy.
    const rawVelocity = (currentX - lastXRef.current) / dt;
    
    // Simple smoothing for velocity
    const smoothedVelocity = velocityRef.current * 0.5 + rawVelocity * 0.5;
    velocityRef.current = smoothedVelocity;

    // FLUX Calculation: Gaussian approximation of a bar magnet passing through a coil
    // Phi(x) = A * exp(-(x^2 / w^2))
    const flux = FLUX_SCALE * Math.exp(-Math.pow(currentX / FLUX_WIDTH_PARAM, 2));
    
    // EMF Calculation: Faraday's Law
    // EMF = -N * dPhi/dt
    // dPhi/dt = dPhi/dx * dx/dt
    // dPhi/dx = A * exp(...) * (-2x / w^2)
    const dPhi_dx = flux * (-2 * currentX / Math.pow(FLUX_WIDTH_PARAM, 2));
    const dPhi_dt = dPhi_dx * smoothedVelocity;
    
    const emf = -turns * dPhi_dt; // Scaling factor included in parameters implicitly

    // Update Refs
    lastTimeRef.current = currentTime;
    lastXRef.current = currentX;

    // Update Display State (throttled slightly by React renders, but refs hold truth)
    setDisplayEMF(prev => prev * EMF_SMOOTHING + emf * (1 - EMF_SMOOTHING));
    setDisplayFlux(flux);
    setDisplayVelocity(smoothedVelocity);

    // Update History (downsample: every 5th frame to avoid React overload)
    frameCountRef.current++;
    if (frameCountRef.current % 5 === 0) {
      setHistory(prev => {
        const newHistory = [...prev, { 
          time: parseFloat((currentTime/1000).toFixed(1)), 
          flux: parseFloat(flux.toFixed(1)), 
          emf: parseFloat(emf.toFixed(1)) 
        }];
        return newHistory.slice(-MAX_HISTORY);
      });
    }

  }, [magnetX, isPlaying, isDragging, oscillationSpeed, turns]);

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;

    const loop = (time: number) => {
      updatePhysics(time);
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [updatePhysics]);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Faraday's Law Simulation</h1>
            <p className="text-slate-500 text-sm">Interactive Virtual Laboratory</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <div className="text-right">
               <div className="text-xs text-slate-400 font-semibold uppercase">Equation</div>
               <div className="font-mono text-indigo-600 font-bold">ε = -N (dΦ/dt)</div>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Visuals */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          
          {/* Simulation Viewport */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
            <div className="bg-slate-100 rounded-xl overflow-hidden relative">
               <SimulationCanvas 
                 magnetX={magnetX} 
                 setMagnetX={setMagnetX} 
                 turns={turns}
                 isDragging={isDragging}
                 setIsDragging={setIsDragging}
                 onDragStart={() => setIsPlaying(false)} // Stop auto-play on interaction
                 onDragEnd={() => {}}
               />
               
               {/* Overlay Status */}
               <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow-sm text-xs font-mono space-y-1 pointer-events-none">
                  <div className="flex justify-between gap-4"><span>Velocity:</span> <span className={displayVelocity > 0 ? "text-green-600" : "text-red-600"}>{displayVelocity.toFixed(1)}</span></div>
                  <div className="flex justify-between gap-4"><span>Position:</span> <span>{magnetX.toFixed(0)}</span></div>
               </div>
            </div>
          </div>

          {/* Graph */}
          <Chart data={history} />
          
        </div>

        {/* Right Column: Controls & Instruments */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Galvanometer */}
          <Galvanometer 
            value={displayEMF * 10} 
            label="Induced EMF" 
            unit="mV" 
            className="flex-1 min-h-[220px]"
          /> 
          {/* Multiplied by 10 for visual scaling on the meter */}

          {/* Controls Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col justify-between min-h-[300px]">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold border-b border-slate-100 pb-3">
              <Settings2 className="w-5 h-5" />
              <span>Experiment Controls</span>
            </div>

            <div className="flex-1 flex flex-col justify-evenly space-y-4">
              
              {/* Turns Slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-600">Coil Turns (N)</label>
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 rounded">{turns}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  step="1"
                  value={turns}
                  onChange={(e) => setTurns(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Oscillation Speed Slider */}
               <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-600">Magnet Speed (Auto)</label>
                  <span className="text-sm font-bold text-slate-700">{oscillationSpeed}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="3" 
                  step="0.5"
                  value={oscillationSpeed}
                  onChange={(e) => setOscillationSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
                    isPlaying 
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {isPlaying ? <><Pause className="w-4 h-4"/> Pause</> : <><Play className="w-4 h-4"/> Auto-Move</>}
                </button>
                
                <button 
                  onClick={() => {
                    setIsPlaying(false);
                    setMagnetX(0);
                    setHistory([]);
                  }}
                  className="flex items-center justify-center p-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  title="Reset Position"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;