// Re-export types
export type * from './types';

// Re-export stores
export * from './stores';

// Re-export services
export * from './services';

// ── Execution State ──
export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export interface ExecutionState {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number | null;
  executionTime: number | null;
}

export const defaultExecutionState: ExecutionState = {
  status: 'idle',
  stdout: '',
  stderr: '',
  output: '',
  exitCode: null,
  executionTime: null,
};

// ── Connected User ──
export interface ConnectedUser {
  name: string;
  color: string;
}
