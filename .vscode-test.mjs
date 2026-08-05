import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/test/**/*.test.js',
	// Pin the VS Code version to a known stable release to avoid downloading an incompatible darwin build in CI.
	version: '1.132.0',
	// Keep this path short to avoid macOS Unix socket length limits in CI.
	launchArgs: ['--user-data-dir=.vscode-u'],
});
