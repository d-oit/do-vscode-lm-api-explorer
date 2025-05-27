import * as assert from 'assert';
import { HtmlGenerator } from '../htmlGenerator';
import { ModelExplorerData, ExtendedLanguageModelChat } from '../types';
import { HTML_CONTENT } from '../constants';

// Mock data for testing
const createMockModel = (id: string, name: string, vendor: string = 'test'): ExtendedLanguageModelChat => ({
	id,
	name,
	vendor,
	family: 'test-family',
	version: '1.0',
	maxInputTokens: 8192,		capabilities: { supportsToolCalling: true },
	countTokens: async () => 10,
	sendRequest: async () => ({
		text: (async function* () {
			yield 'Test response';
		})(),
		stream: (async function* () {
			yield { kind: 'textPart', value: 'Test response' };
		})()
	})
});

const createMockExplorerData = (): ModelExplorerData => {
	const models = [
		createMockModel('test-model-1', 'Test Model 1', 'copilot'),
		createMockModel('test-model-2', 'Test Model 2', 'anthropic')
	];

	return {
		models,
		modelJson: {
			'test-model-1': {
				name: 'Test Model 1',
				id: 'test-model-1',
				vendor: 'copilot',
				family: 'test-family',
				version: '1.0',
				maxInputTokens: 8192,
				capabilities: { tools: true }
			},
			'test-model-2': {
				name: 'Test Model 2',
				id: 'test-model-2',
				vendor: 'anthropic',
				family: 'test-family',
				version: '1.0',
				maxInputTokens: 8192
			}
		},
		sendResults: {
			'test-model-1': {
				request: {
					model: 'test-model-1',
					messages: [{ role: 'user', content: 'Hello! Please respond with a brief greeting.' }],
					options: { justification: 'Testing model capabilities' }
				},
				response: 'Hello! I\'m Test Model 1.'
			},
			'test-model-2': {
				error: 'Request Failed: 400 {"error":{"message":"Model is not supported","code":"model_not_supported"}}'
			}
		}
	};
};

suite('HtmlGenerator Unit Tests', () => {
	test('should generate complete HTML', () => {
		const mockData = createMockExplorerData();
		const html = HtmlGenerator.generateHtml(mockData, 'test-version');
		
		// Basic HTML structure
		assert.ok(html.includes('<!DOCTYPE html>'));
		assert.ok(html.includes('<html lang="en">'));
		assert.ok(html.includes('</html>'));
		assert.ok(html.includes('<head>'));
		assert.ok(html.includes('</head>'));
		assert.ok(html.includes('<body>'));
		assert.ok(html.includes('</body>'));
		
		// Title
		assert.ok(html.includes('<title>Language Model Explorer</title>'));
	});

	test('should include header with correct constants', () => {
		const mockData = createMockExplorerData();
		const html = HtmlGenerator.generateHtml(mockData, 'test-version');
		
		assert.ok(html.includes(HTML_CONTENT.HEADER.TITLE));
		assert.ok(html.includes(HTML_CONTENT.HEADER.SUBTITLE));
	});

	test('should include all section headings', () => {
		const mockData = createMockExplorerData();
		const html = HtmlGenerator.generateHtml(mockData, 'test-version');
		
		assert.ok(html.includes(HTML_CONTENT.SECTIONS.MODELS));
		assert.ok(html.includes(HTML_CONTENT.SECTIONS.REQUEST_OPTIONS));
		assert.ok(html.includes(HTML_CONTENT.SECTIONS.JSON_EXPORT));
	});

	test('should include model information', () => {
		const mockData = createMockExplorerData();
		const html = HtmlGenerator.generateHtml(mockData, 'test-version');
		
		// Should include model names
		assert.ok(html.includes('Test Model 1'));
		assert.ok(html.includes('Test Model 2'));
		
		// Should include model IDs
		assert.ok(html.includes('test-model-1'));
		assert.ok(html.includes('test-model-2'));
		
		// Should include vendor information
		assert.ok(html.includes('copilot'));
		assert.ok(html.includes('anthropic'));
	});

	test('should handle successful and failed models differently', () => {
		const mockData = createMockExplorerData();
		const html = HtmlGenerator.generateHtml(mockData, 'test-version');
		
		// Successful model should have success icon
		assert.ok(html.includes(HTML_CONTENT.BADGES.SUPPORTED));
		
		// Failed model should have error styling and not supported icon
		assert.ok(html.includes(HTML_CONTENT.BADGES.NOT_SUPPORTED));
		assert.ok(html.includes('Not Supported'));
	});

	test('should include request options documentation', () => {
		const mockData = createMockExplorerData();
		const html = HtmlGenerator.generateHtml(mockData, 'test-version');
		
		// Should include parameter documentation
		assert.ok(html.includes('justification'));
		assert.ok(html.includes('modelOptions'));
		assert.ok(html.includes('tools'));
		assert.ok(html.includes('toolMode'));
		
		// Should include model options sub-parameters
		assert.ok(html.includes('temperature'));
		assert.ok(html.includes('max_tokens'));
		assert.ok(html.includes('top_p'));
		
		// Should include badges
		assert.ok(html.includes(HTML_CONTENT.BADGES.REQUIRED));
		assert.ok(html.includes(HTML_CONTENT.BADGES.OPTIONAL));
	});

	test('should include JSON data sections', () => {
		const mockData = createMockExplorerData();
		const html = HtmlGenerator.generateHtml(mockData, 'test-version');
		
		// Should include JSON sections
		assert.ok(html.includes('Models Summary JSON'));
		assert.ok(html.includes('Test Results JSON'));
		
		// Should include copy buttons
		assert.ok(html.includes(HTML_CONTENT.BUTTONS.COPY));
		
		// Should include the actual JSON data
		const modelJsonString = JSON.stringify(mockData.modelJson, null, 2);
		const sendResultsString = JSON.stringify(mockData.sendResults, null, 2);
		
		// HTML should contain escaped versions of the JSON
		assert.ok(html.includes('Test Model 1'));
		assert.ok(html.includes('test-model-1'));
	});

	test('should include interactive JavaScript', () => {
		const mockData = createMockExplorerData();
		const html = HtmlGenerator.generateHtml(mockData, 'test-version');
		
		// Should include JavaScript functions
		assert.ok(html.includes('function toggleAccordion'));
		assert.ok(html.includes('function copyToClipboard'));
		assert.ok(html.includes('function showToast'));
		
		// Should include toast messages from constants
		assert.ok(html.includes(HTML_CONTENT.TOAST_MESSAGES.COPIED));
		assert.ok(html.includes(HTML_CONTENT.TOAST_MESSAGES.COPY_FAILED));
	});

	test('should include proper CSS styling', () => {
		const mockData = createMockExplorerData();
		const html = HtmlGenerator.generateHtml(mockData, 'test-version');
		
		// Should include CSS variables for VS Code theming
		assert.ok(html.includes('var(--vscode-'));
		
		// Should include key CSS classes
		assert.ok(html.includes('.accordion'));
		assert.ok(html.includes('.json-cell'));
		assert.ok(html.includes('.copy-button'));
		assert.ok(html.includes('.model-error'));
	});

	test('should properly escape HTML in JSON content', () => {
		const mockData = createMockExplorerData();
		// Add some content that needs escaping
		mockData.sendResults['test-model-1'].response = 'Response with <script>alert("xss")</script> content';
		
		const html = HtmlGenerator.generateHtml(mockData, 'test-version');
		
		// Should not contain unescaped script tags
		assert.ok(!html.includes('<script>alert("xss")</script>'));
		// Should contain escaped version
		assert.ok(html.includes('&lt;script&gt;'));
	});

	test('should handle empty data gracefully', () => {
		const emptyData: ModelExplorerData = {
			models: [],
			modelJson: {},
			sendResults: {}
		};
		
		const html = HtmlGenerator.generateHtml(emptyData, 'test-version');
		
		// Should still generate valid HTML structure
		assert.ok(html.includes('<!DOCTYPE html>'));
		assert.ok(html.includes('<html lang="en">'));
		assert.ok(html.includes('</html>'));
		
		// Should include all sections even with empty data
		assert.ok(html.includes(HTML_CONTENT.SECTIONS.MODELS));
		assert.ok(html.includes(HTML_CONTENT.SECTIONS.REQUEST_OPTIONS));
		assert.ok(html.includes(HTML_CONTENT.SECTIONS.JSON_EXPORT));
	});

	test('should handle models with missing optional properties', () => {
		const minimalModel: ExtendedLanguageModelChat = {
			id: 'minimal-model',
			name: 'Minimal Model',
			vendor: 'test',
			family: 'minimal',
			version: '1.0',
			maxInputTokens: 0, // Use 0 to represent unknown
			countTokens: async () => 10,
			sendRequest: async () => ({
				text: (async function* () {
					yield 'Test response';
				})(),
				stream: (async function* () {
					yield { kind: 'textPart', value: 'Test response' };
				})()
			})
		};

		const dataWithMinimalModel: ModelExplorerData = {
			models: [minimalModel],
			modelJson: {
				'minimal-model': {
					name: 'Minimal Model',
					id: 'minimal-model',
					vendor: 'test',
					family: 'minimal',
					version: '1.0',
					maxInputTokens: 0
				}
			},
			sendResults: {}
		};
		
		const html = HtmlGenerator.generateHtml(dataWithMinimalModel, 'test-version');
		
		// Should handle undefined maxInputTokens gracefully
		assert.ok(html.includes('Minimal Model'));
		assert.ok(html.includes('Unknown')); // Should show "Unknown" for undefined maxInputTokens
	});

	test('should include accordion functionality', () => {
		const mockData = createMockExplorerData();
		const html = HtmlGenerator.generateHtml(mockData, 'test-version');
		
		// Should include accordion headers and content
		assert.ok(html.includes('accordion-header'));
		assert.ok(html.includes('accordion-content'));
		assert.ok(html.includes('accordion-icon'));
		
		// Should include proper ARIA attributes
		assert.ok(html.includes('aria-expanded="false"'));
		assert.ok(html.includes('role="button"'));
		assert.ok(html.includes('role="region"'));
		
		// Should include onclick handlers
		assert.ok(html.includes('onclick="toggleAccordion'));
	});
});
