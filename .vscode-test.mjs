import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/test/**/*.test.js',
	// No pinned version and no custom launchArgs — allow @vscode/test-cli to choose a compatible VS Code and defaults.
});
