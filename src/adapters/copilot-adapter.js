/**
 * Copilot适配器
 * 适配Microsoft Copilot网页版
 */
class CopilotAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.selectors = {
            // 输入框选择器
            messageInput: 'textarea[placeholder*="Ask me anything"], div[contenteditable="true"][data-placeholder*="Ask"], .cib-serp-main textarea, #searchbox textarea',
            
            // 发送按钮选择器
            sendButton: 'button[aria-label*="Submit"], button[data-testid="send"], .cib-serp-main button[type="submit"], button:has(svg[data-icon="Send"])',
            
            // 响应容器选择器
            responseContainer: '[data-testid="response"], .ac-container, .cib-serp-main .ac-textBlock, [role="group"] .ac-textBlock',
            
            // 最新响应选择器
            latestResponse: '.ac-container:last-child, .cib-serp-main .ac-textBlock:last-child',
            
            // 加载指示器
            loadingIndicator: '[data-testid="loading"], .loading, .cib-serp-main .loading, .ac-container .loading, .typing-indicator',
            
            // 新对话按钮
            newChatButton: 'button[aria-label*="New topic"], button[data-testid="new-chat"], .cib-serp-main button:has(svg[data-icon="Add"])',
            
            // 错误提示
            errorMessage: '[role="alert"], .error-message, .cib-serp-main .error, .ac-container .error',
            
            // 登录相关
            loginButton: 'button[data-testid="sign-in"], a[href*="login.microsoftonline.com"], button:contains("Sign in")',
            
            // 对话历史
            conversationList: '.cib-serp-main .conversation-item, .chat-history-item',
            
            // 停止生成按钮
            stopButton: 'button[aria-label*="Stop"], button[data-testid="stop"], .cib-serp-main button:has(.stop-icon)',
            
            // 对话模式选择器
            conversationStyle: '.cib-serp-main .conversation-style, .tone-selector',
            
            // 建议回复
            suggestedResponses: '.cib-serp-main .suggested-responses, .quick-replies'
        };
    }

    async initialize() {
        this.log('info', 'Initializing Copilot adapter...');
        
        try {
            // 等待页面加载完成
            await this.waitForPageLoad();
            
            // 检查是否需要登录
            await this.checkLoginStatus();
            
            // 设置对话模式（如果需要）
            await this.setupConversationMode();
            
            // 等待输入框出现
            await this.waitForInputReady();
            
            this.isInitialized = true;
            this.isReady = true;
            
            this.log('info', 'Copilot adapter initialized successfully');
            return true;
            
        } catch (error) {
            this.log('error', 'Failed to initialize Copilot adapter', error);
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
        
        // 等待应用加载
        await this.sleep(3000);
        
        // 等待主要内容加载
        await this.waitForElement('main, #b_content, .cib-serp-main, [data-testid="app"]', 15000);
    }

    async checkLoginStatus() {
        // 检查是否在登录页面
        if (window.location.hostname.includes('login.microsoftonline.com') || 
            document.querySelector(this.selectors.loginButton)) {
            throw new Error('Please login to Microsoft Copilot first');
        }
        
        // 检查是否有访问限制
        const accessDenied = document.querySelector('[data-testid="access-denied"], .access-denied, .blocked');
        if (accessDenied) {
            throw new Error('Access denied to Copilot');
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

    async setupConversationMode() {
        try {
            // 检查是否有对话模式选择器
            const conversationStyle = document.querySelector(this.selectors.conversationStyle);
            if (conversationStyle) {
                // 默认选择平衡模式或创意模式
                const balancedMode = conversationStyle.querySelector('[data-testid="balanced"], [aria-label*="Balanced"]');
                const creativeMode = conversationStyle.querySelector('[data-testid="creative"], [aria-label*="Creative"]');
                
                if (balancedMode && this.isElementInteractable(balancedMode)) {
                    await this.safeClick(balancedMode);
                    this.log('info', 'Selected balanced conversation mode');
                } else if (creativeMode && this.isElementInteractable(creativeMode)) {
                    await this.safeClick(creativeMode);
                    this.log('info', 'Selected creative conversation mode');
                }
                
                await this.sleep(1000);
            }
        } catch (error) {
            this.log('warn', 'Could not setup conversation mode', error);
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
        this.log('info', `Sending message to Copilot: ${message.substring(0, 50)}...`);
        
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
            
            this.log('info', 'Message sent to Copilot successfully');
            return true;
            
        } catch (error) {
            this.log('error', 'Failed to send message to Copilot', error);
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
        this.log('info', 'Waiting for Copilot response...');
        
        try {
            // 等待响应开始
            await this.waitForResponseStart();
            
            // 等待响应完成
            await this.waitForResponseComplete(timeout);
            
            // 获取最新响应内容
            const response = await this.extractResponse();
            
            this.log('info', `Copilot response received: ${response.substring(0, 100)}...`);
            return response;
            
        } catch (error) {
            this.log('error', 'Failed to get Copilot response', error);
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
                this.log('info', 'Copilot response started');
                return;
            }
            
            await this.sleep(300);
        }
        
        throw new Error('Copilot response did not start within timeout');
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
                    this.log('info', 'Copilot response completed');
                    return;
                }
            } else {
                stableCount = 0;
                lastResponseLength = currentResponse.length;
            }
            
            // 检查是否有错误
            const errorMessage = document.querySelector(this.selectors.errorMessage);
            if (errorMessage && this.isElementInteractable(errorMessage)) {
                throw new Error(`Copilot error: ${errorMessage.textContent}`);
            }
            
            await this.sleep(1000);
        }
        
        throw new Error('Copilot response did not complete within timeout');
    }

    async extractResponse() {
        // 获取所有响应容器
        const responseElements = document.querySelectorAll(this.selectors.responseContainer);
        if (responseElements.length === 0) {
            throw new Error('No Copilot response found');
        }
        
        // 找到最新的助手响应
        let latestResponse = null;
        for (let i = responseElements.length - 1; i >= 0; i--) {
            const element = responseElements[i];
            if (!element.textContent.trim()) continue;
            
            // 检查是否是助手的响应（不是用户的消息）
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
            '.ac-textBlock',
            '[data-testid="response-content"]',
            '.response-content',
            '.message-content',
            '.markdown-content',
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
        
        // 清理响应文本
        responseText = this.cleanResponseText(responseText);
        
        if (!responseText) {
            throw new Error('Could not extract Copilot response text');
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
            'More actions',
            'Learn more',
            'Sources'
        ];
        
        let cleanedText = text;
        uiTexts.forEach(uiText => {
            cleanedText = cleanedText.replace(new RegExp(uiText, 'gi'), '');
        });
        
        return cleanedText.trim();
    }

    async clearConversation() {
        this.log('info', 'Clearing Copilot conversation...');
        
        try {
            const newChatButton = document.querySelector(this.selectors.newChatButton);
            if (newChatButton && this.isElementInteractable(newChatButton)) {
                await this.safeClick(newChatButton);
                await this.sleep(3000);
                
                // 等待新对话页面加载
                await this.waitForInputReady();
                
                this.log('info', 'Copilot conversation cleared successfully');
                return true;
            } else {
                // 如果找不到新对话按钮，刷新页面
                window.location.reload();
                return true;
            }
        } catch (error) {
            this.log('error', 'Failed to clear Copilot conversation', error);
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
            this.log('error', 'Failed to get Copilot conversation history', error);
            return [];
        }
    }
}

// 导出适配器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CopilotAdapter;
} else {
    window.CopilotAdapter = CopilotAdapter;
}