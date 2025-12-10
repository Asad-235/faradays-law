export interface SimulationState {
  magnetX: number; // Position relative to center (0)
  magnetVelocity: number;
  flux: number;
  emf: number;
  turns: number;
  isDragging: boolean;
  isPlaying: boolean; // For auto-oscillation
  time: number;
}

export interface PhysicsParams {
  turns: number;
  resistance: number; // Ohms, optional for future current calc
  oscillationSpeed: number;
}

export enum SimulationMode {
  MANUAL = 'MANUAL',
  OSCILLATE = 'OSCILLATE'
}
