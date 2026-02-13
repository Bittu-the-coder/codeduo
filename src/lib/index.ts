// Global reactive state using Svelte 5 runes (module-level)
// stores are simple exported let variables with $state


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
	executionTime: null
};

// ── Connected User ──
export interface ConnectedUser {
	name: string;
	color: string;
}
