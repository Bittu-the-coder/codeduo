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
		boilerplate: `// Welcome to CodeDuo! 🚀
// Start coding in JavaScript

function greet(name) {
    return \`Hello, \${name}! Welcome to CodeDuo.\`;
}

console.log(greet("World"));
`
	},
	{
		id: 'typescript',
		displayName: 'TypeScript',
		monacoId: 'typescript',
		pistonRuntime: 'typescript',
		pistonVersion: '5.0.3',
		extension: '.ts',
		icon: '⟨TS⟩',
		boilerplate: `// Welcome to CodeDuo! 🚀
// Start coding in TypeScript

function greet(name: string): string {
    return \`Hello, \${name}! Welcome to CodeDuo.\`;
}

console.log(greet("World"));
`
	},
	{
		id: 'python',
		displayName: 'Python',
		monacoId: 'python',
		pistonRuntime: 'python',
		pistonVersion: '3.10.0',
		extension: '.py',
		icon: '🐍',
		boilerplate: `# Welcome to CodeDuo! 🚀
# Start coding in Python

def greet(name: str) -> str:
    return f"Hello, {name}! Welcome to CodeDuo."

print(greet("World"))
`
	},
	{
		id: 'c',
		displayName: 'C',
		monacoId: 'c',
		pistonRuntime: 'c',
		pistonVersion: '10.2.0',
		extension: '.c',
		icon: '©',
		boilerplate: `// Welcome to CodeDuo! 🚀
// Start coding in C

#include <stdio.h>

int main() {
    printf("Hello, World! Welcome to CodeDuo.\\n");
    return 0;
}
`
	},
	{
		id: 'cpp',
		displayName: 'C++',
		monacoId: 'cpp',
		pistonRuntime: 'c++',
		pistonVersion: '10.2.0',
		extension: '.cpp',
		icon: '⊕',
		boilerplate: `// Welcome to CodeDuo! 🚀
// Start coding in C++

#include <iostream>
#include <string>

int main() {
    std::string name = "World";
    std::cout << "Hello, " << name << "! Welcome to CodeDuo." << std::endl;
    return 0;
}
`
	},
	{
		id: 'java',
		displayName: 'Java',
		monacoId: 'java',
		pistonRuntime: 'java',
		pistonVersion: '15.0.2',
		extension: '.java',
		icon: '☕',
		boilerplate: `// Welcome to CodeDuo! 🚀
// Start coding in Java

public class Main {
    public static void main(String[] args) {
        String name = "World";
        System.out.println("Hello, " + name + "! Welcome to CodeDuo.");
    }
}
`
	}
];

export function getLanguageById(id: string): LanguageConfig | undefined {
	return languages.find(l => l.id === id);
}

export function getDefaultLanguage(): LanguageConfig {
	return languages[0]; // JavaScript
}
