/**
 * Gemini适配器
 * 适配Google Gemini网页版
 */
class GeminiAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.selectors = {
            // 输入框选择器
            messageInput: 'textarea[placeholder*="Enter a prompt"], div[contenteditable="true"][data-placeholder*="prompt"], rich-textarea textarea, .ql-editor',
            
            // 发送按钮选择器
            sendButton: 'button[aria-label*="Send"], button[data-testid="send"], button:has(svg[data-icon="send"]), button:has(.send-icon)',
            
            // 响应容器选择器
            responseContainer: '[data-testid="response"], .response-container, .model-response, [role="presentation"] > div',
            
            // 最新响应选择器
            latestResponse: '[data-testid="response"]:last-child, .response-container:last-child, .model-response:last-child',
            
            // 加载指示器
            loadingIndicator: '[data-testid="loading"], .loading, .thinking, [aria-label*="Generating"], .spinner',
            
            // 新对话按钮
            newChatButton: 'button[aria-label*="New chat"], button[data-testid="new-chat"], a[href*="new"], button:has(svg[data-icon="add"])',
            
            // 错误提示
            errorMessage: '[role="alert"], .error-message, [data-testid="error"], .warning, .error-banner',
            
            // 登录相关
            loginButton: 'button[data-testid="sign-in"], a[href*="accounts.google.com"], button:contains("Sign in")',
            
            // 对话历史
            conversationList: '[data-testid="conversation"], .conversation-item, .chat-history-item',
            
            // 停止生成按钮
            stopButton: 'button[aria-label*="Stop"], button[data-testid="stop"], button:has(.stop-icon)'
        };
    }

    async initialize() {
        this.log('info', 'Initializing Gemini adapter...');
        
        try {
            // 等待页面加载完成
            await this.waitForPageLoad();
            
            // 检查是否需要登录
            await this.checkLoginStatus();
            
            // 等待输入框出现
            await this.waitForInputReady();
            
            this.isInitialized = true;
            this.isReady = true;
            
            this.log('info', 'Gemini adapter initialized successfully');
            return true;
            
        } catch (error) {
            this.log('error', 'Failed to initialize Gemini adapter', error);
            throw error;
        }
    }

    async waitForPageLoad() {
        // 等待页面基本加载完成
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                window.addEventListener('load', resolve);
            });
        }
        
        // 等待Angular/React应用加载
        await this.sleep(4000);
        
        // 等待主要内容加载
        await this.waitForElement('main, #root, .app, [data-testid="app"], .chat-container', 15000);
    }

    async checkLoginStatus() {
        // 检查是否在登录页面
        if (window.location.hostname.includes('accounts.google.com') || 
            document.querySelector(this.selectors.loginButton)) {
            throw new Error('Please login to Google Gemini first');
        }
        
        // 检查是否有访问限制
        const accessDenied = document.querySelector('[data-testid="access-denied"], .access-denied, .blocked');
        if (accessDenied) {
            throw new Error('Access denied to Gemini');
        }
        
        // 检查反自动化检测
        const antiAutomation = await this.detectAntiAutomation();
        if (antiAutomation.detected) {
            throw new Error(`Anti-automation detected: ${antiAutomation.type}`);
        }
        
        // 检查是否有使用限制提示
        const limitWarning = document.querySelector('[data-testid="usage-limit"], .usage-warning, .rate-limit');
        if (limitWarning) {
            this.log('warn', 'Usage limit warning detected', limitWarning.textContent);
        }
    }

    async waitForInputReady() {
        // 尝试多个可能的输入框选择器
        const inputSelectors = this.selectors.messageInput.split(', ');
        
        for (const selector of inputSelectors) {
            try {
                const input = await this.waitForElement(selector, 8000);
                if (input && this.isElementInteractable(input)) {
                    this.currentInputSelector = selector;
                    this.log('info', `Found input element with selector: ${selector}`);
                    return input;
                }
            } catch (error) {
                continue;
            }
        }
        
        throw new Error('Could not find interactive message input element');
    }

    isElementInteractable(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               !element.disabled &&
               !element.readOnly &&
               element.offsetParent !== null;
    }

    async checkReady() {
        try {
            const input = document.querySelector(this.currentInputSelector || this.selectors.messageInput);
            const sendButton = document.querySelector(this.selectors.sendButton);
            
            // 检查是否正在生成响应
            const isGenerating = document.querySelector(this.selectors.loadingIndicator);
            
            return !!(input && this.isElementInteractable(input) && 
                     (!sendButton || this.isElementInteractable(sendButton)) &&
                     !isGenerating);
        } catch (error) {
            this.log('error', 'Error checking ready status', error);
            return false;
        }
    }

    async sendMessage(message) {
        this.log('info', `Sending message to Gemini: ${message.substring(0, 50)}...`);
        
        try {
            // 确保页面准备就绪
            if (!await this.checkReady()) {
                await this.initialize();
            }
            
            // 获取输入框
            const input = document.querySelector(this.currentInputSelector || this.selectors.messageInput);
            if (!input) {
                throw new Error('Message input not found');
            }
            
            // 清空输入框
            await this.clearInput(input);
            await this.sleep(300);
            
            // 输入消息
            await this.inputMessage(input, message);
            await this.sleep(500);
            
            // 发送消息
            await this.submitMessage(input);
            
            this.log('info', 'Message sent to Gemini successfully');
            return true;
            
        } catch (error) {
            this.log('error', 'Failed to send message to Gemini', error);
            throw error;
        }
    }

    async clearInput(input) {
        // 对于contenteditable元素
        if (input.contentEditable === 'true') {
            input.innerHTML = '';
            input.textContent = '';
        } else {
            input.value = '';
        }
        
        // 触发输入事件
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // 对于rich-textarea，可能需要特殊处理
        if (input.closest('rich-textarea')) {
            const richTextarea = input.closest('rich-textarea');
            richTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    async inputMessage(input, message) {
        if (input.contentEditable === 'true') {
            // 对于contenteditable元素
            input.textContent = message;
            
            // 模拟用户输入
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            // 设置光标到末尾
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(input);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // 对于普通textarea
            input.value = message;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            // 设置光标到末尾
            input.setSelectionRange(message.length, message.length);
        }
        
        // 对于rich-textarea组件的特殊处理
        if (input.closest('rich-textarea')) {
            const richTextarea = input.closest('rich-textarea');
            richTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            richTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    async submitMessage(input) {
        // 尝试点击发送按钮
        const sendButton = document.querySelector(this.selectors.sendButton);
        if (sendButton && this.isElementInteractable(sendButton)) {
            await this.safeClick(sendButton);
            return;
        }
        
        // 如果没有发送按钮，尝试按Enter键
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
        
        input.dispatchEvent(enterEvent);
        
        // 也尝试keyup事件
        const enterUpEvent = new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        });
        
        input.dispatchEvent(enterUpEvent);
    }

    async getResponse(timeout = 90000) {
        this.log('info', 'Waiting for Gemini response...');
        
        try {
            // 等待响应开始
            await this.waitForResponseStart();
            
            // 等待响应完成
            await this.waitForResponseComplete(timeout);
            
            // 获取最新响应内容
            const response = await this.extractResponse();
            
            this.log('info', `Gemini response received: ${response.substring(0, 100)}...`);
            return response;
            
        } catch (error) {
            this.log('error', 'Failed to get Gemini response', error);
            throw error;
        }
    }

    async waitForResponseStart() {
        const startTime = Date.now();
        const timeout = 20000;
        
        while (Date.now() - startTime < timeout) {
            // 检查是否有新的响应容器或加载指示器
            const responseContainer = document.querySelector(this.selectors.responseContainer);
            const loadingIndicator = document.querySelector(this.selectors.loadingIndicator);
            
            if (responseContainer || loadingIndicator) {
                this.log('info', 'Gemini response started');
                return;
            }
            
            await this.sleep(300);
        }
        
        throw new Error('Gemini response did not start within timeout');
    }

    async waitForResponseComplete(timeout) {
        const startTime = Date.now();
        let lastResponseLength = 0;
        let stableCount = 0;
        
        while (Date.now() - startTime < timeout) {
            // 检查是否还在加载
            const loadingIndicator = document.querySelector(this.selectors.loadingIndicator);
            if (loadingIndicator && this.isElementInteractable(loadingIndicator)) {
                await this.sleep(1000);
                continue;
            }
            
            // 检查是否有停止按钮（表示正在生成）
            const stopButton = document.querySelector(this.selectors.stopButton);
            if (stopButton && this.isElementInteractable(stopButton)) {
                await this.sleep(1000);
                continue;
            }
            
            // 检查响应内容是否稳定
            const currentResponse = await this.extractResponse().catch(() => '');
            if (currentResponse.length === lastResponseLength && currentResponse.length > 0) {
                stableCount++;
                if (stableCount >= 3) {
                    this.log('info', 'Gemini response completed');
                    return;
                }
            } else {
                stableCount = 0;
                lastResponseLength = currentResponse.length;
            }
            
            // 检查是否有错误
            const errorMessage = document.querySelector(this.selectors.errorMessage);
            if (errorMessage && this.isElementInteractable(errorMessage)) {
                throw new Error(`Gemini error: ${errorMessage.textContent}`);
            }
            
            await this.sleep(1000);
        }
        
        throw new Error('Gemini response did not complete within timeout');
    }

    async extractResponse() {
        // 获取所有响应容器
        const responseElements = document.querySelectorAll(this.selectors.responseContainer);
        if (responseElements.length === 0) {
            throw new Error('No Gemini response found');
        }
        
        // 找到最新的模型响应
        let latestResponse = null;
        for (let i = responseElements.length - 1; i >= 0; i--) {
            const element = responseElements[i];
            if (!element.textContent.trim()) continue;
            
            // 检查是否是模型的响应（不是用户的消息）
            const isUserMessage = element.closest('[data-testid="user-message"]') || 
                                 element.classList.contains('user-message') ||
                                 element.querySelector('.user-avatar');
            
            if (!isUserMessage) {
                latestResponse = element;
                break;
            }
        }
        
        if (!latestResponse) {
            latestResponse = responseElements[responseElements.length - 1];
        }
        
        // 提取文本内容
        let responseText = '';
        
        // 尝试不同的内容提取方法
        const contentSelectors = [
            '[data-testid="response-content"]',
            '.response-content',
            '.model-response-text',
            '.markdown-content',
            '.message-content',
            'p',
            'div'
        ];
        
        for (const selector of contentSelectors) {
            const contentElements = latestResponse.querySelectorAll(selector);
            if (contentElements.length > 0) {
                responseText = Array.from(contentElements)
                    .map(el => el.textContent.trim())
                    .filter(text => text.length > 0)
                    .join('\n');
                break;
            }
        }
        
        // 如果没有找到特定选择器，使用整个元素的文本
        if (!responseText) {
            responseText = latestResponse.textContent.trim();
        }
        
        // 清理响应文本（移除可能的UI元素文本）
        responseText = this.cleanResponseText(responseText);
        
        if (!responseText) {
            throw new Error('Could not extract Gemini response text');
        }
        
        return responseText;
    }

    cleanResponseText(text) {
        // 移除常见的UI元素文本
        const uiTexts = [
            'Copy',
            'Share',
            'Regenerate',
            'Good response',
            'Bad response',
            'Thumb up',
            'Thumb down',
            'More actions'
        ];
        
        let cleanedText = text;
        uiTexts.forEach(uiText => {
            cleanedText = cleanedText.replace(new RegExp(uiText, 'gi'), '');
        });
        
        return cleanedText.trim();
    }

    async clearConversation() {
        this.log('info', 'Clearing Gemini conversation...');
        
        try {
            const newChatButton = document.querySelector(this.selectors.newChatButton);
            if (newChatButton && this.isElementInteractable(newChatButton)) {
                await this.safeClick(newChatButton);
                await this.sleep(3000);
                
                // 等待新对话页面加载
                await this.waitForInputReady();
                
                this.log('info', 'Gemini conversation cleared successfully');
                return true;
            } else {
                // 如果找不到新对话按钮，刷新页面
                window.location.reload();
                return true;
            }
        } catch (error) {
            this.log('error', 'Failed to clear Gemini conversation', error);
            throw error;
        }
    }

    async getConversationHistory() {
        try {
            const messages = [];
            
            // 获取所有消息元素
            const messageElements = document.querySelectorAll(this.selectors.responseContainer);
            
            messageElements.forEach((element, index) => {
                const content = element.textContent.trim();
                if (!content) return;
                
                // 判断消息角色
                const isUser = element.closest('[data-testid="user-message"]') || 
                              element.classList.contains('user-message') ||
                              element.querySelector('.user-avatar');
                
                messages.push({
                    role: isUser ? 'user' : 'assistant',
                    content: this.cleanResponseText(content),
                    timestamp: Date.now(),
                    index
                });
            });
            
            return messages;
        } catch (error) {
            this.log('error', 'Failed to get Gemini conversation history', error);
            return [];
        }
    }
}

// 导出适配器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiAdapter;
} else {
    window.GeminiAdapter = GeminiAdapter;
}