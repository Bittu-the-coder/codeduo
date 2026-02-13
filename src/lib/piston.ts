// Piston API client for remote code execution

const PISTON_API = 'https://emkc.org/api/v2/piston';

export interface ExecutionResult {
	stdout: string;
	stderr: string;
	output: string;
	exitCode: number;
	signal: string | null;
	executionTime: number;
}

export interface PistonRuntime {
	language: string;
	version: string;
	aliases: string[];
}

export async function executeCode(
	language: string,
	version: string,
	code: string,
	stdin: string = ''
): Promise<ExecutionResult> {
	const startTime = performance.now();

	try {
		const response = await fetch(`${PISTON_API}/execute`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				language,
				version,
				files: [
					{
						name: `main`,
						content: code
					}
				],
				stdin,
				compile_timeout: 10000,
				run_timeout: 10000,
				compile_memory_limit: -1,
				run_memory_limit: -1
			})
		});

		if (!response.ok) {
			throw new Error(`Piston API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		const executionTime = Math.round(performance.now() - startTime);

		const run = data.run || {};
		const compile = data.compile || {};

		// If compilation failed, show compile errors
		if (compile.stderr) {
			return {
				stdout: compile.stdout || '',
				stderr: compile.stderr,
				output: compile.stderr,
				exitCode: compile.code ?? 1,
				signal: compile.signal || null,
				executionTime
			};
		}

		return {
			stdout: run.stdout || '',
			stderr: run.stderr || '',
			output: (run.stdout || '') + (run.stderr ? '\n' + run.stderr : ''),
			exitCode: run.code ?? 0,
			signal: run.signal || null,
			executionTime
		};
	} catch (error) {
		const executionTime = Math.round(performance.now() - startTime);
		const message = error instanceof Error ? error.message : 'Unknown error occurred';

		return {
			stdout: '',
			stderr: message,
			output: `Error: ${message}`,
			exitCode: 1,
			signal: null,
			executionTime
		};
	}
}

export async function getRuntimes(): Promise<PistonRuntime[]> {
	const response = await fetch(`${PISTON_API}/runtimes`);
	if (!response.ok) {
		throw new Error(`Failed to fetch runtimes: ${response.status}`);
	}
	return response.json();
}
