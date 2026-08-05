import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/test/**/*.test.js',
	// Keep this path short to avoid macOS Unix socket length limits in CI.
	launchArgs: ['--user-data-dir=.vscode-u'],
	// No pinned version — allow @vscode/test-cli to choose a compatible VS Code.
});
