// Language configurations for Monaco Editor and Piston API execution
export interface LanguageConfig {
	id: string;
	displayName: string;
	monacoId: string;
	pistonRuntime: string;
	pistonVersion: string;
	extension: string;
	icon: string;
	boilerplate: string;
}

export const languages: LanguageConfig[] = [
	{
		id: 'javascript',
		displayName: 'JavaScript',
		monacoId: 'javascript',
		pistonRuntime: 'javascript',
		pistonVersion: '18.15.0',
		extension: '.js',
		icon: '⟨JS⟩',
		boilerplate: ''
	},
	{
		id: 'typescript',
		displayName: 'TypeScript',
		monacoId: 'typescript',
		pistonRuntime: 'typescript',
		pistonVersion: '5.0.3',
		extension: '.ts',
		icon: '⟨TS⟩',
		boilerplate: ''
	},
	{
		id: 'python',
		displayName: 'Python',
		monacoId: 'python',
		pistonRuntime: 'python',
		pistonVersion: '3.10.0',
		extension: '.py',
		icon: '🐍',
		boilerplate: ''
	},
	{
		id: 'c',
		displayName: 'C',
		monacoId: 'c',
		pistonRuntime: 'c',
		pistonVersion: '10.2.0',
		extension: '.c',
		icon: '©',
		boilerplate: ''
	},
	{
		id: 'cpp',
		displayName: 'C++',
		monacoId: 'cpp',
		pistonRuntime: 'c++',
		pistonVersion: '10.2.0',
		extension: '.cpp',
		icon: '⊕',
		boilerplate: ''
	},
	{
		id: 'java',
		displayName: 'Java',
		monacoId: 'java',
		pistonRuntime: 'java',
		pistonVersion: '15.0.2',
		extension: '.java',
		icon: '☕',
		boilerplate: ''
	}
];

export function getLanguageById(id: string): LanguageConfig | undefined {
	return languages.find(l => l.id === id);
}

export function getDefaultLanguage(): LanguageConfig {
	return languages[0]; // JavaScript
}
