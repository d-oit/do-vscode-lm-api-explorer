import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to the extension test runner script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './index'); // Assuming index.ts will load all test files

		console.log('Extension development path:', extensionDevelopmentPath);
		console.log('Extension tests path:', extensionTestsPath);

		// Detect if we're in a CI environment
		const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
		console.log('Running in CI environment:', isCI);
		// Configure launch arguments based on environment
		const launchArgs = isCI ? [
			// '--headless', // Add this flag for headless execution in CI
			'--disable-gpu',
			'--disable-dev-shm-usage',
			'--no-sandbox',
			// '--disable-background-timer-throttling',
			// '--disable-backgrounding-occluded-windows',
			// '--disable-renderer-backgrounding',
			// '--disable-extensions-except=' + extensionDevelopmentPath,
			'--disable-workspace-trust'
		] : [
			// Add argument to enable GitHub Copilot Chat extension for local testing
			'--enable-extension', 'github.copilot-chat'
		];
		console.log('Launch arguments:', launchArgs);

		// Download VS Code, unzip it and run the tests
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs,
			// Add version specification for better compatibility
			version: 'stable',
			// Add timeout for CI environments
			...(isCI && { timeout: 300000 }), // 5 minutes timeout for CI
			// Install GitHub Copilot Chat extension for testing
			extensions: ['github.copilot-chat']
		} as any); // Use type assertion to bypass potential type definition issues
	} catch (err) {
		console.error('Failed to run tests:', err);
		process.exit(1);
	}
}

main();