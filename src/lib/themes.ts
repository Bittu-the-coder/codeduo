// VS Code theme definitions converted to Monaco Editor format
// Each theme provides colors for the editor and token colorization rules

import type * as monaco from 'monaco-editor';

export interface ThemeDefinition {
	id: string;
	displayName: string;
	type: 'dark' | 'light';
	uiColors: {
		bg: string;
		surface: string;
		text: string;
		textSecondary: string;
		border: string;
		accent: string;
	};
	data: monaco.editor.IStandaloneThemeData;
}

export const themes: ThemeDefinition[] = [
	// ───── DARK THEMES ─────
	{
		id: 'codeduo-dark',
		displayName: 'CodeDuo Dark',
		type: 'dark',
		uiColors: {
			bg: '#1a1e1e',
			surface: '#2C3333',
			text: '#E7F6F2',
			textSecondary: '#A5C9CA',
			border: 'rgba(165, 201, 202, 0.15)',
			accent: '#A5C9CA'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
				{ token: 'keyword', foreground: 'A5C9CA' },
				{ token: 'string', foreground: 'CE9178' },
				{ token: 'number', foreground: 'B5CEA8' },
				{ token: 'type', foreground: '4EC9B0' },
				{ token: 'function', foreground: 'DCDCAA' },
				{ token: 'variable', foreground: 'E7F6F2' },
				{ token: 'constant', foreground: '4FC1FF' },
				{ token: 'operator', foreground: 'A5C9CA' },
				{ token: 'delimiter', foreground: 'A5C9CA' },
			],
			colors: {
				'editor.background': '#1a1e1e',
				'editor.foreground': '#E7F6F2',
				'editor.lineHighlightBackground': '#2C333350',
				'editor.selectionBackground': '#395B6450',
				'editorCursor.foreground': '#A5C9CA',
				'editorLineNumber.foreground': '#5a6868',
				'editorLineNumber.activeForeground': '#A5C9CA',
				'editor.inactiveSelectionBackground': '#395B6430',
				'editorIndentGuide.background': '#2C333380',
				'editorIndentGuide.activeBackground': '#395B6480',
				'editorWidget.background': '#222828',
				'editorWidget.border': '#395B64',
				'editorSuggestWidget.background': '#222828',
				'editorSuggestWidget.border': '#395B64',
				'editorSuggestWidget.selectedBackground': '#395B6450',
				'minimap.background': '#1a1e1e',
			}
		}
	},
	{
		id: 'one-dark-pro',
		displayName: 'One Dark Pro',
		type: 'dark',
		uiColors: {
			bg: '#282c34',
			surface: '#21252b',
			text: '#abb2bf',
			textSecondary: '#7f848e',
			border: '#3e4452',
			accent: '#61afef'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
				{ token: 'keyword', foreground: 'c678dd' },
				{ token: 'string', foreground: '98c379' },
				{ token: 'number', foreground: 'd19a66' },
				{ token: 'type', foreground: 'e5c07b' },
				{ token: 'function', foreground: '61afef' },
				{ token: 'variable', foreground: 'e06c75' },
				{ token: 'constant', foreground: 'd19a66' },
				{ token: 'operator', foreground: '56b6c2' },
			],
			colors: {
				'editor.background': '#282c34',
				'editor.foreground': '#abb2bf',
				'editor.lineHighlightBackground': '#2c313c',
				'editor.selectionBackground': '#3e4452',
				'editorCursor.foreground': '#528bff',
				'editorLineNumber.foreground': '#4b5263',
				'editorLineNumber.activeForeground': '#abb2bf',
				'editorIndentGuide.background': '#3c3f4a',
				'editorWidget.background': '#21252b',
			}
		}
	},
	{
		id: 'dracula',
		displayName: 'Dracula',
		type: 'dark',
		uiColors: {
			bg: '#282a36',
			surface: '#21222c',
			text: '#f8f8f2',
			textSecondary: '#6272a4',
			border: '#44475a',
			accent: '#bd93f9'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
				{ token: 'keyword', foreground: 'ff79c6' },
				{ token: 'string', foreground: 'f1fa8c' },
				{ token: 'number', foreground: 'bd93f9' },
				{ token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
				{ token: 'function', foreground: '50fa7b' },
				{ token: 'variable', foreground: 'f8f8f2' },
				{ token: 'constant', foreground: 'bd93f9' },
				{ token: 'operator', foreground: 'ff79c6' },
			],
			colors: {
				'editor.background': '#282a36',
				'editor.foreground': '#f8f8f2',
				'editor.lineHighlightBackground': '#44475a75',
				'editor.selectionBackground': '#44475a',
				'editorCursor.foreground': '#f8f8f2',
				'editorLineNumber.foreground': '#6272a4',
				'editorLineNumber.activeForeground': '#f8f8f2',
				'editorWidget.background': '#21222c',
			}
		}
	},
	{
		id: 'github-dark',
		displayName: 'GitHub Dark',
		type: 'dark',
		uiColors: {
			bg: '#0d1117',
			surface: '#161b22',
			text: '#c9d1d9',
			textSecondary: '#8b949e',
			border: '#30363d',
			accent: '#58a6ff'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
				{ token: 'keyword', foreground: 'ff7b72' },
				{ token: 'string', foreground: 'a5d6ff' },
				{ token: 'number', foreground: '79c0ff' },
				{ token: 'type', foreground: 'ffa657' },
				{ token: 'function', foreground: 'd2a8ff' },
				{ token: 'variable', foreground: 'ffa657' },
				{ token: 'constant', foreground: '79c0ff' },
				{ token: 'operator', foreground: 'ff7b72' },
			],
			colors: {
				'editor.background': '#0d1117',
				'editor.foreground': '#c9d1d9',
				'editor.lineHighlightBackground': '#161b22',
				'editor.selectionBackground': '#264f78',
				'editorCursor.foreground': '#c9d1d9',
				'editorLineNumber.foreground': '#484f58',
				'editorLineNumber.activeForeground': '#c9d1d9',
				'editorWidget.background': '#161b22',
			}
		}
	},
	{
		id: 'monokai',
		displayName: 'Monokai',
		type: 'dark',
		uiColors: {
			bg: '#272822',
			surface: '#1e1f1c',
			text: '#f8f8f2',
			textSecondary: '#75715e',
			border: '#3e3d32',
			accent: '#a6e22e'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '75715e', fontStyle: 'italic' },
				{ token: 'keyword', foreground: 'f92672' },
				{ token: 'string', foreground: 'e6db74' },
				{ token: 'number', foreground: 'ae81ff' },
				{ token: 'type', foreground: '66d9ef', fontStyle: 'italic' },
				{ token: 'function', foreground: 'a6e22e' },
				{ token: 'variable', foreground: 'f8f8f2' },
				{ token: 'constant', foreground: 'ae81ff' },
				{ token: 'operator', foreground: 'f92672' },
			],
			colors: {
				'editor.background': '#272822',
				'editor.foreground': '#f8f8f2',
				'editor.lineHighlightBackground': '#3e3d3250',
				'editor.selectionBackground': '#49483e',
				'editorCursor.foreground': '#f8f8f0',
				'editorLineNumber.foreground': '#90908a',
				'editorLineNumber.activeForeground': '#c2c2bf',
				'editorWidget.background': '#1e1f1c',
			}
		}
	},
	{
		id: 'nord',
		displayName: 'Nord',
		type: 'dark',
		uiColors: {
			bg: '#2e3440',
			surface: '#3b4252',
			text: '#d8dee9',
			textSecondary: '#81a1c1',
			border: '#434c5e',
			accent: '#88c0d0'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '616e88', fontStyle: 'italic' },
				{ token: 'keyword', foreground: '81a1c1' },
				{ token: 'string', foreground: 'a3be8c' },
				{ token: 'number', foreground: 'b48ead' },
				{ token: 'type', foreground: '8fbcbb' },
				{ token: 'function', foreground: '88c0d0' },
				{ token: 'variable', foreground: 'd8dee9' },
				{ token: 'constant', foreground: 'b48ead' },
				{ token: 'operator', foreground: '81a1c1' },
			],
			colors: {
				'editor.background': '#2e3440',
				'editor.foreground': '#d8dee9',
				'editor.lineHighlightBackground': '#3b425280',
				'editor.selectionBackground': '#434c5e',
				'editorCursor.foreground': '#d8dee9',
				'editorLineNumber.foreground': '#4c566a',
				'editorLineNumber.activeForeground': '#d8dee9',
				'editorWidget.background': '#3b4252',
			}
		}
	},
	{
		id: 'tokyo-night',
		displayName: 'Tokyo Night',
		type: 'dark',
		uiColors: {
			bg: '#1a1b26',
			surface: '#24283b',
			text: '#a9b1d6',
			textSecondary: '#565f89',
			border: '#3b4261',
			accent: '#7aa2f7'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '565f89', fontStyle: 'italic' },
				{ token: 'keyword', foreground: '9d7cd8' },
				{ token: 'string', foreground: '9ece6a' },
				{ token: 'number', foreground: 'ff9e64' },
				{ token: 'type', foreground: '2ac3de' },
				{ token: 'function', foreground: '7aa2f7' },
				{ token: 'variable', foreground: 'c0caf5' },
				{ token: 'constant', foreground: 'ff9e64' },
				{ token: 'operator', foreground: '89ddff' },
			],
			colors: {
				'editor.background': '#1a1b26',
				'editor.foreground': '#a9b1d6',
				'editor.lineHighlightBackground': '#292e42',
				'editor.selectionBackground': '#364a82',
				'editorCursor.foreground': '#c0caf5',
				'editorLineNumber.foreground': '#3b4261',
				'editorLineNumber.activeForeground': '#737aa2',
				'editorWidget.background': '#24283b',
			}
		}
	},
	{
		id: 'catppuccin-mocha',
		displayName: 'Catppuccin Mocha',
		type: 'dark',
		uiColors: {
			bg: '#1e1e2e',
			surface: '#313244',
			text: '#cdd6f4',
			textSecondary: '#a6adc8',
			border: '#45475a',
			accent: '#cba6f7'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '6c7086', fontStyle: 'italic' },
				{ token: 'keyword', foreground: 'cba6f7' },
				{ token: 'string', foreground: 'a6e3a1' },
				{ token: 'number', foreground: 'fab387' },
				{ token: 'type', foreground: 'f9e2af' },
				{ token: 'function', foreground: '89b4fa' },
				{ token: 'variable', foreground: 'cdd6f4' },
				{ token: 'constant', foreground: 'fab387' },
				{ token: 'operator', foreground: '89dceb' },
			],
			colors: {
				'editor.background': '#1e1e2e',
				'editor.foreground': '#cdd6f4',
				'editor.lineHighlightBackground': '#31324480',
				'editor.selectionBackground': '#585b7080',
				'editorCursor.foreground': '#f5e0dc',
				'editorLineNumber.foreground': '#45475a',
				'editorLineNumber.activeForeground': '#bac2de',
				'editorWidget.background': '#313244',
			}
		}
	},
	{
		id: 'solarized-dark',
		displayName: 'Solarized Dark',
		type: 'dark',
		uiColors: {
			bg: '#002b36',
			surface: '#073642',
			text: '#839496',
			textSecondary: '#586e75',
			border: '#0a4652',
			accent: '#268bd2'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '586e75', fontStyle: 'italic' },
				{ token: 'keyword', foreground: '859900' },
				{ token: 'string', foreground: '2aa198' },
				{ token: 'number', foreground: 'd33682' },
				{ token: 'type', foreground: 'b58900' },
				{ token: 'function', foreground: '268bd2' },
				{ token: 'variable', foreground: '839496' },
				{ token: 'constant', foreground: 'cb4b16' },
				{ token: 'operator', foreground: '859900' },
			],
			colors: {
				'editor.background': '#002b36',
				'editor.foreground': '#839496',
				'editor.lineHighlightBackground': '#073642',
				'editor.selectionBackground': '#073642',
				'editorCursor.foreground': '#839496',
				'editorLineNumber.foreground': '#586e75',
				'editorLineNumber.activeForeground': '#839496',
				'editorWidget.background': '#073642',
			}
		}
	},
	{
		id: 'andromeda',
		displayName: 'Andromeda',
		type: 'dark',
		uiColors: {
			bg: '#23262e',
			surface: '#1e2025',
			text: '#d5ced9',
			textSecondary: '#7e7a86',
			border: '#2f323b',
			accent: '#00e8c6'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '656178', fontStyle: 'italic' },
				{ token: 'keyword', foreground: 'c74ded' },
				{ token: 'string', foreground: 'f39c12' },
				{ token: 'number', foreground: 'f39c12' },
				{ token: 'type', foreground: 'ffe66d' },
				{ token: 'function', foreground: '00e8c6' },
				{ token: 'variable', foreground: 'ee5d43' },
				{ token: 'constant', foreground: 'f39c12' },
				{ token: 'operator', foreground: '00e8c6' },
			],
			colors: {
				'editor.background': '#23262e',
				'editor.foreground': '#d5ced9',
				'editor.lineHighlightBackground': '#2b2d37',
				'editor.selectionBackground': '#3c3f4a',
				'editorCursor.foreground': '#f8f8f0',
				'editorLineNumber.foreground': '#46444f',
				'editorLineNumber.activeForeground': '#d5ced9',
				'editorWidget.background': '#1e2025',
			}
		}
	},
	{
		id: 'palenight',
		displayName: 'Palenight',
		type: 'dark',
		uiColors: {
			bg: '#292d3e',
			surface: '#1f2233',
			text: '#a6accd',
			textSecondary: '#676e95',
			border: '#3a3f58',
			accent: '#82aaff'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '676e95', fontStyle: 'italic' },
				{ token: 'keyword', foreground: 'c792ea' },
				{ token: 'string', foreground: 'c3e88d' },
				{ token: 'number', foreground: 'f78c6c' },
				{ token: 'type', foreground: 'ffcb6b' },
				{ token: 'function', foreground: '82aaff' },
				{ token: 'variable', foreground: 'f07178' },
				{ token: 'constant', foreground: 'f78c6c' },
				{ token: 'operator', foreground: '89ddff' },
			],
			colors: {
				'editor.background': '#292d3e',
				'editor.foreground': '#a6accd',
				'editor.lineHighlightBackground': '#32374d',
				'editor.selectionBackground': '#3c435e',
				'editorCursor.foreground': '#ffcc00',
				'editorLineNumber.foreground': '#3a3f5c',
				'editorLineNumber.activeForeground': '#a6accd',
				'editorWidget.background': '#1f2233',
			}
		}
	},
	{
		id: 'ayu-dark',
		displayName: 'Ayu Dark',
		type: 'dark',
		uiColors: {
			bg: '#0a0e14',
			surface: '#0d1017',
			text: '#bfbdb6',
			textSecondary: '#565b66',
			border: '#1c222b',
			accent: '#e6b450'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '5c6773', fontStyle: 'italic' },
				{ token: 'keyword', foreground: 'ff8f40' },
				{ token: 'string', foreground: 'aad94c' },
				{ token: 'number', foreground: 'e6b450' },
				{ token: 'type', foreground: '59c2ff' },
				{ token: 'function', foreground: 'ffb454' },
				{ token: 'variable', foreground: 'bfbdb6' },
				{ token: 'constant', foreground: 'e6b450' },
				{ token: 'operator', foreground: 'f29668' },
			],
			colors: {
				'editor.background': '#0a0e14',
				'editor.foreground': '#bfbdb6',
				'editor.lineHighlightBackground': '#131721',
				'editor.selectionBackground': '#273747',
				'editorCursor.foreground': '#e6b450',
				'editorLineNumber.foreground': '#3d424d',
				'editorLineNumber.activeForeground': '#bfbdb6',
				'editorWidget.background': '#0d1017',
			}
		}
	},
	{
		id: 'vitesse-dark',
		displayName: 'Vitesse Dark',
		type: 'dark',
		uiColors: {
			bg: '#121212',
			surface: '#1e1e1e',
			text: '#dbd7ca',
			textSecondary: '#666666',
			border: '#2e2e2e',
			accent: '#4d9375'
		},
		data: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '5c5c5c', fontStyle: 'italic' },
				{ token: 'keyword', foreground: '4d9375' },
				{ token: 'string', foreground: 'c98a7d' },
				{ token: 'number', foreground: '4c9a91' },
				{ token: 'type', foreground: '5da9a7' },
				{ token: 'function', foreground: '80a665' },
				{ token: 'variable', foreground: 'bd976a' },
				{ token: 'constant', foreground: 'c99076' },
				{ token: 'operator', foreground: 'cb7676' },
			],
			colors: {
				'editor.background': '#121212',
				'editor.foreground': '#dbd7ca',
				'editor.lineHighlightBackground': '#1e1e1e',
				'editor.selectionBackground': '#3a3a3a',
				'editorCursor.foreground': '#dbd7ca',
				'editorLineNumber.foreground': '#3a3a3a',
				'editorLineNumber.activeForeground': '#dbd7ca',
				'editorWidget.background': '#1e1e1e',
			}
		}
	},

	// ───── LIGHT THEMES ─────
	{
		id: 'github-light',
		displayName: 'GitHub Light',
		type: 'light',
		uiColors: {
			bg: '#ffffff',
			surface: '#f6f8fa',
			text: '#24292f',
			textSecondary: '#57606a',
			border: '#d0d7de',
			accent: '#0969da'
		},
		data: {
			base: 'vs',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
				{ token: 'keyword', foreground: 'cf222e' },
				{ token: 'string', foreground: '0a3069' },
				{ token: 'number', foreground: '0550ae' },
				{ token: 'type', foreground: '953800' },
				{ token: 'function', foreground: '8250df' },
				{ token: 'variable', foreground: '953800' },
				{ token: 'constant', foreground: '0550ae' },
				{ token: 'operator', foreground: 'cf222e' },
			],
			colors: {
				'editor.background': '#ffffff',
				'editor.foreground': '#24292f',
				'editor.lineHighlightBackground': '#f6f8fa',
				'editor.selectionBackground': '#add6ff80',
				'editorCursor.foreground': '#0969da',
				'editorLineNumber.foreground': '#8c959f',
				'editorLineNumber.activeForeground': '#24292f',
				'editorWidget.background': '#f6f8fa',
			}
		}
	},
	{
		id: 'solarized-light',
		displayName: 'Solarized Light',
		type: 'light',
		uiColors: {
			bg: '#fdf6e3',
			surface: '#eee8d5',
			text: '#657b83',
			textSecondary: '#93a1a1',
			border: '#ddd6c1',
			accent: '#268bd2'
		},
		data: {
			base: 'vs',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '93a1a1', fontStyle: 'italic' },
				{ token: 'keyword', foreground: '859900' },
				{ token: 'string', foreground: '2aa198' },
				{ token: 'number', foreground: 'd33682' },
				{ token: 'type', foreground: 'b58900' },
				{ token: 'function', foreground: '268bd2' },
				{ token: 'variable', foreground: '657b83' },
				{ token: 'constant', foreground: 'cb4b16' },
				{ token: 'operator', foreground: '859900' },
			],
			colors: {
				'editor.background': '#fdf6e3',
				'editor.foreground': '#657b83',
				'editor.lineHighlightBackground': '#eee8d5',
				'editor.selectionBackground': '#eee8d5',
				'editorCursor.foreground': '#657b83',
				'editorLineNumber.foreground': '#93a1a1',
				'editorLineNumber.activeForeground': '#657b83',
				'editorWidget.background': '#eee8d5',
			}
		}
	},
	{
		id: 'catppuccin-latte',
		displayName: 'Catppuccin Latte',
		type: 'light',
		uiColors: {
			bg: '#eff1f5',
			surface: '#e6e9ef',
			text: '#4c4f69',
			textSecondary: '#6c6f85',
			border: '#ccd0da',
			accent: '#8839ef'
		},
		data: {
			base: 'vs',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '9ca0b0', fontStyle: 'italic' },
				{ token: 'keyword', foreground: '8839ef' },
				{ token: 'string', foreground: '40a02b' },
				{ token: 'number', foreground: 'fe640b' },
				{ token: 'type', foreground: 'df8e1d' },
				{ token: 'function', foreground: '1e66f5' },
				{ token: 'variable', foreground: '4c4f69' },
				{ token: 'constant', foreground: 'fe640b' },
				{ token: 'operator', foreground: '04a5e5' },
			],
			colors: {
				'editor.background': '#eff1f5',
				'editor.foreground': '#4c4f69',
				'editor.lineHighlightBackground': '#e6e9ef',
				'editor.selectionBackground': '#ccd0da80',
				'editorCursor.foreground': '#dc8a78',
				'editorLineNumber.foreground': '#9ca0b0',
				'editorLineNumber.activeForeground': '#4c4f69',
				'editorWidget.background': '#e6e9ef',
			}
		}
	},
];

export function getThemeById(id: string): ThemeDefinition | undefined {
	return themes.find(t => t.id === id);
}

export function getDefaultTheme(): ThemeDefinition {
	return themes[0]; // CodeDuo Dark
}

export function getDarkThemes(): ThemeDefinition[] {
	return themes.filter(t => t.type === 'dark');
}

export function getLightThemes(): ThemeDefinition[] {
	return themes.filter(t => t.type === 'light');
}
