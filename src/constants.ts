// Constants for the VS Code Language Model Explorer extension

// Command IDs
export const COMMANDS = {
    DISCOVER_MODELS: 'do-vscode-lm-explorer.discoverModels',
    CLEAR_CACHE_AND_DISCOVER: 'do-vscode-lm-explorer.clearCacheAndDiscover',
    CUSTOM_TEST: 'do-vscode-lm-explorer.customTest',
    COMPARE_MODELS: 'do-vscode-lm-explorer.compareModels',
    EXPORT_DATA: 'do-vscode-lm-explorer.exportData'
} as const;

// UI Text Constants
export const UI_TEXT = {
    EXTENSION_NAME: 'd.o. vscode-lm Explorer',
    ACTIVATION_MESSAGE: 'Congratulations, your extension "do-vscode-lm-explorer" is now active!',
    
    // Progress Messages
    PROGRESS: {
        TITLE: 'Discovering & Testing AI Models...',
        DISCOVERING: 'Discovering available AI models...',
        ANALYZING: 'Analyzing model capabilities...',
        TESTING: 'Testing AI model responses...',
        PREPARING: 'Preparing AI model explorer...',
        COMPLETE: 'AI Model Discovery Complete!'    },
      // Notifications
    NOTIFICATIONS: {
        SUCCESS: (count: number) => `🤖 Discovered ${count} AI models! Use the explorer to copy API parameters and test responses.`,
        NO_MODELS: 'No AI models found. Please ensure GitHub Copilot Chat is installed and you have granted permission to access language models. If this is your first time using the extension, try running the command again.',
        CACHE_CLEARED: 'AI Model Explorer cache cleared. Rediscovering models...',
        CANCELLED: 'AI model discovery was cancelled.',
        ERROR: (error: string) => `Failed to discover AI models: ${error}`,
        MODEL_NOT_SUPPORTED: (modelId: string) => `AI Model Explorer: Model "${modelId}" is not supported for chat requests. Please check your AI provider setup.`,
        PREMIUM_REQUEST_WARNING: '⚠️ Important: Testing models will send requests that count as premium requests to your GitHub Copilot account. This may consume your monthly quota. Learn more: https://docs.github.com/en/copilot/managing-copilot/monitoring-usage-and-entitlements/about-premium-requests',
        SUCCESS_WITHOUT_TEST: (count: number) => `🤖 Discovered ${count} AI models! Model testing was skipped to avoid premium request usage.`    },
    
    // Button Labels
    BUTTONS: {
        OPEN_EXPLORER: 'Open Explorer',
        SETUP_GUIDE: 'Setup Guide',
        COPY: 'Copy',
        TEST_MODELS: 'Test Models',
        SKIP_TESTING: 'Skip Testing',
        LEARN_MORE: 'Learn More'
    },
    
    // Webview Constants
    WEBVIEW: {
        VIEW_TYPE: 'lmModelExplorer',
        TITLE: 'AI Model Explorer'
    },
    
    // Test Constants
    TEST: {
        JUSTIFICATION: 'Testing model capabilities for VS Code LM Explorer extension',
        MESSAGE: 'Hello! Please respond with a brief greeting.'
    }
} as const;

// HTML Content Constants
export const HTML_CONTENT = {
    HEADER: {
        TITLE: '🚀 VS Code Language Model Explorer',
        SUBTITLE: 'Explore available language models and their capabilities in VS Code'
    },
    SECTIONS: {
        MODELS: '📋 Available Models',
        REQUEST_OPTIONS: '⚙️ Language Model Chat Request Options',
        JSON_EXPORT: '📄 JSON Data Export'
    },
    BADGES: {
        SUPPORTED: '✅',
        NOT_SUPPORTED: '❌',
        REQUIRED: 'REQUIRED',
        OPTIONAL: 'OPTIONAL'
    },
    
    TOAST_MESSAGES: {
        COPIED: 'Copied to clipboard!',
        COPY_FAILED: 'Copy failed'
    },
    BUTTONS: {
        COPY: 'Copy'
    }
} as const;

// Model Options Configuration
export const MODEL_OPTIONS = [
    { 
        key: 'temperature', 
        type: 'number', 
        description: 'Controls randomness (0.0-2.0). Lower = more deterministic', 
        example: '0.7' 
    },
    { 
        key: 'max_tokens', 
        type: 'number', 
        description: 'Maximum tokens in response', 
        example: '1000' 
    },
    { 
        key: 'top_p', 
        type: 'number', 
        description: 'Nucleus sampling parameter (0.0-1.0)', 
        example: '0.9' 
    },
    { 
        key: 'frequency_penalty', 
        type: 'number', 
        description: 'Reduces repetition (-2.0 to 2.0)', 
        example: '0.0' 
    },
    { 
        key: 'presence_penalty', 
        type: 'number', 
        description: 'Encourages new topics (-2.0 to 2.0)', 
        example: '0.0' 
    },
    { 
        key: 'stop', 
        type: 'string | string[]', 
        description: 'Stop sequences for generation', 
        example: '["\\n", "END"]' 
    }
] as const;

// Language Model Chat Request Options Configuration
export const LANGUAGE_MODEL_CHAT_REQUEST_OPTIONS = [
    {
        key: 'justification',
        type: 'string',
        description: 'A human-readable string explaining the reason for accessing the language model. Used for user consent and auditing.',
        example: '"Analyzing code for security vulnerabilities"',
        required: true
    },
    {
        key: 'modelOptions',
        type: 'Record<string, any>',
        description: 'Model-specific options that control behavior. These vary by provider and model.',
        example: '{ "temperature": 0.7, "max_tokens": 1000, "top_p": 0.9 }',
        required: false,
        subOptions: MODEL_OPTIONS
    },
    {
        key: 'tools',
        type: 'LanguageModelChatTool[]',
        description: 'Array of tools/functions the model can call during the conversation.',
        example: '[{ name: "search", description: "Search the web" }]',
        required: false
    },
    {
        key: 'toolMode',
        type: 'LanguageModelChatToolMode',
        description: 'How the model should use tools. Values: Auto (default), Required, or None.',
        example: 'LanguageModelChatToolMode.Auto',
        required: false
    }
] as const;

// Progress Steps Configuration
export const PROGRESS_STEPS = {
    FETCH_MODELS: { increment: 10, weight: 1 },
    ANALYZE_CAPABILITIES: { increment: 20, weight: 1 },
    TEST_MODELS: { increment: 60, weight: 3 }, // Testing is the most time-consuming
    PREPARE_RESULTS: { increment: 10, weight: 1 }
} as const;

// External URLs
export const URLS = {
    COPILOT_SETUP_GUIDE: 'https://docs.github.com/en/copilot/using-github-copilot',
    PREMIUM_REQUESTS_INFO: 'https://docs.github.com/en/copilot/managing-copilot/monitoring-usage-and-entitlements/about-premium-requests',
    GITHUB_ACTIONS: 'https://github.com/features/actions'
} as const;

// Workflow Constants
export const WORKFLOW = {
    AUTO_SYNC: {
        NAME: 'Auto-sync Dev to Main',
        DESCRIPTION: 'Automatically syncs changes from dev to main branch with quality gates'
    }
} as const;

// Date Constants
export const DATES = {
    PREMIUM_REQUEST_WARNING_START: new Date('2025-06-04T00:00:00Z')
} as const;

// Error Messages
export const ERROR_MESSAGES = {
    NO_MODELS: 'No language models available. Please ensure GitHub Copilot Chat is installed and you have granted permission to access language models. If this is your first time using the extension, try running the command again - VS Code should prompt you to grant permission.',
    FETCH_FAILED: (error: string) => `Failed to fetch language models: ${error}`,
    MODEL_NOT_SUPPORTED: 'Model is not supported',
    REQUEST_FAILED_400: 'Request Failed: 400'
} as const;
