import { ExtendedLanguageModelChat, ModelExplorerData } from './types';
import { 
	LANGUAGE_MODEL_CHAT_REQUEST_OPTIONS, 
	MODEL_OPTIONS, 
	HTML_CONTENT 
} from './constants';

export class HtmlGenerator {

	static generateHtml(data: ModelExplorerData): string {
		return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Language Model Explorer</title>
	<style>
		${this.getStyles()}
	</style>
</head>
<body>
	${this.generateHeader()}
	${this.generateModelsSection(data.models, data.sendResults)}
	${this.generateRequestOptionsSection()}
	${this.generateJsonSection(data)}
	${this.generateToast()}
	${this.generateScripts()}
</body>
</html>`;
	}

	private static getStyles(): string {
		return `
			body { 
				font-family: var(--vscode-font-family, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
				font-size: var(--vscode-font-size, 13px);
				line-height: 1.4;
				color: var(--vscode-foreground);
				background-color: var(--vscode-editor-background);
				margin: 1.5em;
			}
			
			h1, h2, h3 {
				color: var(--vscode-titleBar-activeForeground, var(--vscode-foreground));
				border-bottom: 1px solid var(--vscode-panel-border, #e1e4e8);
				padding-bottom: 0.5em;
				margin-top: 2em;
			}
			
			h1 { font-size: 1.8em; }
			h2 { font-size: 1.4em; }
			h3 { font-size: 1.2em; }
			
			table { 
				border-collapse: collapse; 
				width: 100%; 
				margin-bottom: 2em;
				background-color: var(--vscode-editor-background);
			}
			
			th, td { 
				border: 1px solid var(--vscode-panel-border, #e1e4e8); 
				padding: 0.75em 0.5em;
				text-align: left;
				vertical-align: top;
			}
			
			th { 
				background-color: var(--vscode-list-hoverBackground, #f0f0f0);
				font-weight: 600;
				color: var(--vscode-list-activeSelectionForeground, var(--vscode-foreground));
			}
			
			.json-cell, .code-block {
				font-family: var(--vscode-editor-font-family, 'Consolas', 'Courier New', monospace);
				font-size: var(--vscode-editor-font-size, 12px);
				background-color: var(--vscode-textCodeBlock-background, #f6f8fa);
				padding: 0.5em;
				border-radius: 4px;
				white-space: pre-wrap;
				word-break: break-word;
				border: 1px solid var(--vscode-panel-border, #e1e4e8);
			}
			
			.accordion {
				margin-bottom: 1em;
			}
			
			.accordion-header {
				background: var(--vscode-button-secondaryBackground, #f3f3f3);
				color: var(--vscode-button-secondaryForeground, #000);
				cursor: pointer;
				padding: 1em;
				border: 1px solid var(--vscode-panel-border, #e1e4e8);
				border-radius: 4px 4px 0 0;
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-weight: 600;
				transition: background-color 0.2s;
			}
			
			.accordion-header:hover {
				background: var(--vscode-button-secondaryHoverBackground, #e8e8e8);
			}
			
			.accordion-header.active {
				background: var(--vscode-button-background, #007acc);
				color: var(--vscode-button-foreground, white);
				border-radius: 4px 4px 0 0;
			}
			
			.accordion-content {
				display: none;
				padding: 1em;
				border: 1px solid var(--vscode-panel-border, #e1e4e8);
				border-top: none;
				border-radius: 0 0 4px 4px;
				background-color: var(--vscode-editor-background);
			}
			
			.accordion-content.active {
				display: block;
			}
			
			.accordion-icon {
				transition: transform 0.2s;
			}
			
			.accordion-icon.rotated {
				transform: rotate(180deg);
			}
			
			.json-container {
				position: relative;
				margin-bottom: 2em;
			}
			
			.json-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 0.5em;
			}
			
			.copy-button {
				background: var(--vscode-button-background, #007acc);
				color: var(--vscode-button-foreground, white);
				border: none;
				padding: 6px 12px;
				border-radius: 3px;
				cursor: pointer;
				font-size: 12px;
				display: flex;
				align-items: center;
				gap: 4px;
				transition: background-color 0.2s;
			}
			
			.copy-button:hover {
				background: var(--vscode-button-hoverBackground, #005a9e);
			}
			
			.copy-button:active {
				background: var(--vscode-button-secondaryBackground, #005577);
			}
			
			.copy-icon {
				width: 14px;
				height: 14px;
				fill: currentColor;
			}
			
			pre { 
				background-color: var(--vscode-textCodeBlock-background, #f6f8fa);
				color: var(--vscode-textPreformat-foreground, var(--vscode-foreground));
				padding: 1em;
				border-radius: 6px;
				border: 1px solid var(--vscode-panel-border, #e1e4e8);
				overflow-x: auto;
				white-space: pre-wrap;
				word-wrap: break-word;
				font-family: var(--vscode-editor-font-family, 'Consolas', 'Courier New', monospace);
				font-size: var(--vscode-editor-font-size, 12px);
				line-height: 1.5;
				margin: 0;
			}
			
			.model-error { 
				color: var(--vscode-errorForeground, #ffffff);
				background: var(--vscode-inputValidation-errorBackground, #d32f2f);
				padding: 0.75em;
				border-radius: 6px;
				margin: 0.5em 0;
				border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
			}
			
			.model-error strong { 
				font-weight: bold; 
			}
			
			h2.model-error { 
				background: var(--vscode-inputValidation-errorBackground, #d32f2f);
				color: var(--vscode-errorForeground, #ffffff);
				padding: 0.75em;
				border-radius: 6px;
				border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
			}
			
			.success-toast {
				position: fixed;
				top: 20px;
				right: 20px;
				background: var(--vscode-notificationsInfoIcon-foreground, #007acc);
				color: white;
				padding: 12px 16px;
				border-radius: 4px;
				z-index: 1000;
				opacity: 0;
				transform: translateY(-20px);
				transition: all 0.3s ease;
			}
			
			.success-toast.show {
				opacity: 1;
				transform: translateY(0);
			}
			
			.param-table {
				margin-top: 1em;
			}
			
			.param-table th {
				background: var(--vscode-button-secondaryBackground, #f3f3f3);
			}
			
			.sub-options {
				margin-left: 1em;
				margin-top: 0.5em;
				font-size: 0.9em;
			}
			
			.required-badge {
				background: var(--vscode-inputValidation-errorBackground, #d32f2f);
				color: white;
				padding: 2px 6px;
				border-radius: 3px;
				font-size: 10px;
				margin-left: 8px;
			}
			
			.optional-badge {
				background: var(--vscode-button-secondaryBackground, #6c757d);
				color: white;
				padding: 2px 6px;
				border-radius: 3px;
				font-size: 10px;
				margin-left: 8px;
			}
		`;
	}
	private static generateHeader(): string {
		return `
			<div style="text-align: center; margin-bottom: 2em;">
				<h1>${HTML_CONTENT.HEADER.TITLE}</h1>
				<p style="font-size: 1.1em; color: var(--vscode-descriptionForeground);">
					${HTML_CONTENT.HEADER.SUBTITLE}
				</p>
			</div>
		`;
	}
	private static generateModelsSection(models: ExtendedLanguageModelChat[], sendResults: any): string {
		return `
			<h1>${HTML_CONTENT.SECTIONS.MODELS}</h1>
			${models.map(model => this.generateModelCard(model, sendResults)).join('')}
		`;
	}	private static generateModelCard(model: ExtendedLanguageModelChat, sendResults: any): string {
		const error = sendResults && sendResults[model.id]?.error;
		const is400 = error && error.includes('Request Failed: 400');
		const isModelNotSupported = error && (error.includes('model_not_supported') || error.includes('Model is not supported'));
		const errorDetails = sendResults && sendResults[model.id]?.errorDetails;
		const response = sendResults && sendResults[model.id]?.response;
		const requestOptions = sendResults && sendResults[model.id]?.request?.options;
		const notSupportedIcon = HTML_CONTENT.BADGES.NOT_SUPPORTED;
		const supportedIcon = HTML_CONTENT.BADGES.SUPPORTED;
		
		return `
			<div class="accordion">
				<div class="accordion-header${is400 || isModelNotSupported ? ' model-error' : ''}"
					id="header-model-${this.escapeHtml(model.id)}"
					role="button"
					tabindex="0"
					aria-expanded="false"
					aria-controls="content-model-${this.escapeHtml(model.id)}"
					onclick="toggleAccordion('content-model-${this.escapeHtml(model.id)}', 'header-model-${this.escapeHtml(model.id)}')">
					<span>
						${(is400 || isModelNotSupported) ? notSupportedIcon : supportedIcon}
						${this.escapeHtml(model.name)}
						<small>(${this.escapeHtml(model.id)})</small>
						${is400 || isModelNotSupported ? ' - Not Supported' : ''}
					</span>
					<span class="accordion-icon">▼</span>
				</div>
				<div class="accordion-content"
					id="content-model-${this.escapeHtml(model.id)}"
					role="region"
					aria-labelledby="header-model-${this.escapeHtml(model.id)}">
					${isModelNotSupported ? '<p class="model-error"><strong>⚠️ This model is not supported for chat requests</strong></p>' : ''}
					<table class="param-table">
						<tr><th>Property</th><th>Value</th></tr>
						<tr><td>Vendor</td><td>${this.escapeHtml(model.vendor)}</td></tr>
						<tr><td>Family</td><td>${this.escapeHtml(model.family)}</td></tr>
						<tr><td>Version</td><td>${this.escapeHtml(model.version)}</td></tr>
						<tr><td>Max Input Tokens</td><td>${model.maxInputTokens && model.maxInputTokens > 0 ? model.maxInputTokens.toLocaleString() : 'Unknown'}</td></tr>
						${model.capabilities ? `<tr><td>Capabilities</td><td><div class="json-cell">${this.escapeHtml(JSON.stringify(model.capabilities, null, 2))}</div></td></tr>` : ''}
						${requestOptions ? `<tr><td>Request Options Used</td><td><div class="json-cell">${this.escapeHtml(JSON.stringify(requestOptions, null, 2))}</div></td></tr>` : ''}
						${response ? `<tr><td>Test Response</td><td><div class="json-cell">${this.escapeHtml(response)}</div></td></tr>` : ''}
						${errorDetails ? `<tr><td colspan='2'><b>Error Details:</b><br>Message: ${this.escapeHtml(errorDetails.message || '')}<br>Code: ${this.escapeHtml(errorDetails.code || '')}<br>Cause: ${this.escapeHtml(String(errorDetails.cause) || '')}</td></tr>` : ''}
					</table>
				</div>
			</div>
		`;
	}	private static generateRequestOptionsSection(): string {
		return `
			<h1>${HTML_CONTENT.SECTIONS.REQUEST_OPTIONS}</h1>
			<p>Complete interface documentation for <code>LanguageModelChatRequestOptions</code>. This extension uses model defaults for better compatibility.</p>
			
			<table class="param-table">
				<tr>
					<th>Parameter</th>
					<th>Type</th>
					<th>Description</th>
					<th>Example</th>
					<th>Required</th>
				</tr>
				${LANGUAGE_MODEL_CHAT_REQUEST_OPTIONS.map(param => `
					<tr>
						<td><strong>${param.key}</strong></td>
						<td><code>${param.type}</code></td>						<td>
							${param.description}
							${param.key === 'modelOptions' ? `
								<div class="sub-options">
									<strong>Common modelOptions (when specified):</strong><br>
									${MODEL_OPTIONS.map(sub => 
										`• <code>${sub.key}</code> (${sub.type}): ${sub.description}<br>`
									).join('')}
									<em>Note: This extension uses model defaults (no explicit modelOptions) to ensure optimal compatibility across different providers.</em>
								</div>
							` : ''}
						</td>
						<td><div class="code-block">${param.example}</div></td>
						<td>
							${param.required ?
								`<span class="required-badge">${HTML_CONTENT.BADGES.REQUIRED}</span>` : 
								`<span class="optional-badge">${HTML_CONTENT.BADGES.OPTIONAL}</span>`
							}
						</td>
					</tr>
				`).join('')}
			</table>
		`;
	}
	private static generateJsonSection(data: ModelExplorerData): string {
		return `
			<h1>${HTML_CONTENT.SECTIONS.JSON_EXPORT}</h1>
			
			<div class="accordion">
				<div class="accordion-header"
					id="header-models-json"
					role="button"
					tabindex="0"
					aria-expanded="false"
					aria-controls="content-models-json"
					onclick="toggleAccordion('content-models-json', 'header-models-json')">
					<span>📊 Models Summary JSON</span>
					<span class="accordion-icon">▼</span>
				</div>
				<div class="accordion-content"
					id="content-models-json"
					role="region"
					aria-labelledby="header-models-json">
					<div class="json-container">
						<div class="json-header">
							<h3>Models Data</h3>
							<button class="copy-button" onclick="copyToClipboard('modelJson')">
								<svg class="copy-icon" viewBox="0 0 16 16">
									<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
									<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
								</svg>
								${HTML_CONTENT.BUTTONS.COPY}
							</button>
						</div>
						<pre id="modelJson">${this.escapeHtml(JSON.stringify(data.modelJson, null, 2))}</pre>
					</div>
				</div>
			</div>
			
			<div class="accordion">
				<div class="accordion-header"
					id="header-test-results"
					role="button"
					tabindex="0"
					aria-expanded="false"
					aria-controls="content-test-results"
					onclick="toggleAccordion('content-test-results', 'header-test-results')">
					<span>🧪 Test Results JSON</span>
					<span class="accordion-icon">▼</span>
				</div>
				<div class="accordion-content"
					id="content-test-results"
					role="region"
					aria-labelledby="header-test-results">
					<div class="json-container">
						<div class="json-header">
							<h3>Send Request Results</h3>
							<button class="copy-button" onclick="copyToClipboard('sendResults')">
								<svg class="copy-icon" viewBox="0 0 16 16">
									<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
									<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
								</svg>
								${HTML_CONTENT.BUTTONS.COPY}
							</button>
						</div>
						<pre id="sendResults">${this.escapeHtml(JSON.stringify(data.sendResults, null, 2))}</pre>
					</div>
				</div>
			</div>
		`;
	}

	private static generateToast(): string {
		return '<div id="toast" class="success-toast"></div>';
	}
	private static generateScripts(): string {
		return `
			<script>
				function toggleAccordion(contentId, headerId) {
					const content = document.getElementById(contentId);
					const header = document.getElementById(headerId);
					const icon = header.querySelector('.accordion-icon');
					
					const isExpanded = content.classList.toggle('active');
					header.classList.toggle('active');
					icon.classList.toggle('rotated');
					header.setAttribute('aria-expanded', isExpanded);
				}
				
				function copyToClipboard(elementId) {
					const element = document.getElementById(elementId);
					const text = element.textContent || element.innerText;
					
					if (navigator.clipboard && window.isSecureContext) {
						navigator.clipboard.writeText(text).then(() => {
							showToast('${HTML_CONTENT.TOAST_MESSAGES.COPIED}');
						}).catch(err => {
							console.error('Failed to copy: ', err);
							fallbackCopyTextToClipboard(text);
						});
					} else {
						fallbackCopyTextToClipboard(text);
					}
				}
				
				function fallbackCopyTextToClipboard(text) {
					const textArea = document.createElement('textarea');
					textArea.value = text;
					textArea.style.top = '0';
					textArea.style.left = '0';
					textArea.style.position = 'fixed';
					textArea.style.opacity = '0';
					
					document.body.appendChild(textArea);
					textArea.focus();
					textArea.select();
					
					try {
						const successful = document.execCommand('copy');
						if (successful) {
							showToast('${HTML_CONTENT.TOAST_MESSAGES.COPIED}');
						} else {
							showToast('${HTML_CONTENT.TOAST_MESSAGES.COPY_FAILED}');
						}
					} catch (err) {
						console.error('Fallback: Oops, unable to copy', err);
						showToast('${HTML_CONTENT.TOAST_MESSAGES.COPY_FAILED}');
					}
					
					document.body.removeChild(textArea);
				}
				
				function showToast(message) {
					const toast = document.getElementById('toast');
					toast.textContent = message;
					toast.classList.add('show');
					
					setTimeout(() => {
						toast.classList.remove('show');
					}, 2000);
				}
			</script>
		`;
	}

	private static escapeHtml(str: string): string {
		return str.replace(/[&<>]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[tag] || tag));
	}
}
