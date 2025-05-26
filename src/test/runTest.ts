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

		// Download VS Code, unzip it and run the tests
		await runTests({ 
			extensionDevelopmentPath, 
			extensionTestsPath,
			// Run VS Code in headless mode for CI environments
			launchArgs: [
				'--headless',
				'--disable-gpu',
				'--disable-dev-shm-usage',
				'--no-sandbox'
			]
		});
	} catch (err) {
		console.error('Failed to run tests:', err);
		process.exit(1);
	}
}

main();