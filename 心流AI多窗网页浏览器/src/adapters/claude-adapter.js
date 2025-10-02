/**
 * Claude适配器
 * 适配Anthropic Claude网页版
 */
class ClaudeAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.selectors = {
            // 输入框选择器
            messageInput: 'div[contenteditable="true"][data-testid="chat-input"], div[contenteditable="true"].ProseMirror, textarea[placeholder*="Talk to Claude"]',
            
            // 发送按钮选择器
            sendButton: 'button[aria-label*="Send"], button[data-testid="send-button"], button:has(svg[data-icon="send"])',
            
            // 响应容器选择器
            responseContainer: '[data-testid="message"], .message, [data-role="assistant"]',
            
            // 最新响应选择器
            latestResponse: '[data-testid="message"]:last-child, .message:last-child',
            
            // 加载指示器
            loadingIndicator: '[data-testid="loading"], .loading, .thinking, [aria-label*="thinking"]',
            
            // 新对话按钮
            newChatButton: 'button[aria-label*="New chat"], a[href*="new"], button:has(svg[data-icon="plus"])',
            
            // 错误提示
            errorMessage: '[role="alert"], .error, [data-testid="error"], .warning',
            
            // 登录相关
            loginButton: 'button[data-testid="login"], a[href*="login"], button:contains("Sign in")',
            
            // 对话历史
            conversationList: '[data-testid="conversation"], .conversation-item, .chat-item'
        };
    }

    async initialize() {
        this.log('info', 'Initializing Claude adapter...');
        
        try {
            // 等待页面加载完成
            await this.waitForPageLoad();
            
            // 检查是否需要登录
            await this.checkLoginStatus();
            
            // 等待输入框出现
            await this.waitForInputReady();
            
            this.isInitialized = true;
            this.isReady = true;
            
            this.log('info', 'Claude adapter initialized successfully');
            return true;
            
        } catch (error) {
            this.log('error', 'Failed to initialize Claude adapter', error);
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
        
        // 等待React/Vue应用加载
        await this.sleep(3000);
        
        // 等待主要内容加载
        await this.waitForElement('main, #root, .app, [data-testid="chat"]', 10000);
    }

    async checkLoginStatus() {
        // 检查是否在登录页面
        if (window.location.pathname.includes('/login') || 
            window.location.pathname.includes('/auth') ||
            document.querySelector(this.selectors.loginButton)) {
            throw new Error('Please login to Claude first');
        }
        
        // 增强的反自动化检测
        const antiAutomation = await this.detectAntiAutomationEnhanced();
        if (antiAutomation.detected) {
            this.log('warn', `反自动化检测触发: ${antiAutomation.type}`, antiAutomation);
            
            // 尝试处理反自动化检测
            const handled = await this.handleAntiAutomation(antiAutomation);
            if (!handled) {
                throw new Error(`Anti-automation detected: ${antiAutomation.type}`);
            }
        }
        
        // 检查是否有使用限制提示
        const limitWarning = document.querySelector('[data-testid="usage-limit"], .usage-warning, .rate-limit');
        if (limitWarning) {
            this.log('warn', 'Usage limit warning detected', limitWarning.textContent);
        }
    }

    // 增强的反自动化检测
    async detectAntiAutomationEnhanced() {
        const indicators = [
            // 验证码相关
            'iframe[src*="captcha"]',
            '[class*="captcha"]',
            '[id*="captcha"]',
            '[data-testid*="captcha"]',
            
            // 人机验证相关
            '[class*="challenge"]',
            '[id*="challenge"]',
            '[data-testid*="challenge"]',
            'div:contains("正在验证您是否是真人")',
            'div:contains("Verifying you are human")',
            'div:contains("Please verify")',
            'div:contains("Security check")',
            
            // Cloudflare相关
            '[class*="cloudflare"]',
            '[id*="cloudflare"]',
            'div:contains("Checking your browser")',
            'div:contains("DDoS protection")',
            
            // 访问限制相关
            '[class*="blocked"]',
            '[class*="forbidden"]',
            '[class*="access-denied"]',
            'div:contains("Access denied")',
            'div:contains("Forbidden")',
            'div:contains("Rate limited")',
            
            // Claude特定的检测
            'div:contains("这可能需要几秒钟时间")',
            'div:contains("This may take a few seconds")',
            '[data-testid="verification"]',
            '[aria-label*="verification"]'
        ];
        
        for (const selector of indicators) {
            let element = null;
            
            // 处理包含文本的选择器
            if (selector.includes(':contains(')) {
                const text = selector.match(/:contains\("([^"]+)"\)/)[1];
                element = Array.from(document.querySelectorAll('div, span, p')).find(el => 
                    el.textContent && el.textContent.includes(text)
                );
            } else {
                element = document.querySelector(selector);
            }
            
            if (element) {
                return {
                    detected: true,
                    type: selector,
                    element: element,
                    text: element.textContent || '',
                    isVisible: this.isElementVisible(element)
                };
            }
        }
        
        // 检查页面标题
        const title = document.title.toLowerCase();
        if (title.includes('verification') || title.includes('challenge') || 
            title.includes('captcha') || title.includes('security')) {
            return {
                detected: true,
                type: 'page_title',
                element: null,
                text: document.title,
                isVisible: true
            };
        }
        
        return { detected: false };
    }

    // 检查元素是否可见
    isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetParent !== null;
    }

    // 处理反自动化检测
    async handleAntiAutomation(antiAutomation) {
        this.log('info', '尝试处理反自动化检测...', antiAutomation);
        
        try {
            // 如果是验证页面，等待验证完成
            if (antiAutomation.type.includes('verification') || 
                antiAutomation.type.includes('challenge') ||
                antiAutomation.text.includes('正在验证') ||
                antiAutomation.text.includes('Verifying')) {
                
                this.log('info', '检测到验证页面，等待验证完成...');
                
                // 等待验证完成，最多等待30秒
                const maxWaitTime = 30000;
                const startTime = Date.now();
                
                while (Date.now() - startTime < maxWaitTime) {
                    await this.sleep(2000);
                    
                    // 重新检测是否还有反自动化元素
                    const currentDetection = await this.detectAntiAutomationEnhanced();
                    if (!currentDetection.detected) {
                        this.log('info', '验证已完成');
                        return true;
                    }
                    
                    // 检查是否有输入框出现（验证完成的标志）
                    const input = document.querySelector(this.selectors.messageInput);
                    if (input && this.isElementInteractable(input)) {
                        this.log('info', '检测到输入框，验证可能已完成');
                        return true;
                    }
                }
                
                this.log('warn', '验证等待超时');
                return false;
            }
            
            // 如果是其他类型的阻止，尝试刷新页面
            if (antiAutomation.type.includes('blocked') || 
                antiAutomation.type.includes('forbidden')) {
                this.log('info', '检测到访问被阻止，尝试刷新页面...');
                window.location.reload();
                return false; // 刷新后需要重新初始化
            }
            
            return false;
            
        } catch (error) {
            this.log('error', '处理反自动化检测时出错', error);
            return false;
        }
    }

    async waitForInputReady() {
        // 尝试多个可能的输入框选择器
        const inputSelectors = this.selectors.messageInput.split(', ');
        
        for (const selector of inputSelectors) {
            try {
                const input = await this.waitForElement(selector, 5000);
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
               element.offsetParent !== null;
    }

    async checkReady() {
        try {
            const input = document.querySelector(this.currentInputSelector || this.selectors.messageInput);
            const sendButton = document.querySelector(this.selectors.sendButton);
            
            return !!(input && this.isElementInteractable(input) && 
                     (!sendButton || this.isElementInteractable(sendButton)));
        } catch (error) {
            this.log('error', 'Error checking ready status', error);
            return false;
        }
    }

    async sendMessage(message) {
        this.log('info', `Sending message to Claude: ${message.substring(0, 50)}...`);
        
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
            await this.sleep(this.getInputDelay());
            
            // 输入消息
            await this.inputMessage(input, message);
            await this.sleep(this.getInputDelay());
            
            // 发送消息
            await this.submitMessage(input);
            
            this.log('info', 'Message sent to Claude successfully');
            return true;
            
        } catch (error) {
            this.log('error', 'Failed to send message to Claude', error);
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
            // 对于contenteditable元素，使用innerHTML或textContent
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
            // 对于普通input/textarea
            input.value = message;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
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

    async getResponse(timeout = 60000) {
        this.log('info', 'Waiting for Claude response...');
        
        try {
            // 等待响应开始
            await this.waitForResponseStart();
            
            // 等待响应完成
            await this.waitForResponseComplete(timeout);
            
            // 获取最新响应内容
            const response = await this.extractResponse();
            
            this.log('info', `Claude response received: ${response.substring(0, 100)}...`);
            return response;
            
        } catch (error) {
            this.log('error', 'Failed to get Claude response', error);
            throw error;
        }
    }

    async waitForResponseStart() {
        const startTime = Date.now();
        const timeout = 15000;
        
        while (Date.now() - startTime < timeout) {
            // 检查是否有新的响应容器或加载指示器
            const responseContainer = document.querySelector(this.selectors.responseContainer);
            const loadingIndicator = document.querySelector(this.selectors.loadingIndicator);
            
            if (responseContainer || loadingIndicator) {
                this.log('info', 'Claude response started');
                return;
            }
            
            await this.sleep(200);
        }
        
        throw new Error('Claude response did not start within timeout');
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
            
            // 检查响应内容是否稳定
            const currentResponse = await this.extractResponse().catch(() => '');
            if (currentResponse.length === lastResponseLength) {
                stableCount++;
                if (stableCount >= 3) {
                    this.log('info', 'Claude response completed');
                    return;
                }
            } else {
                stableCount = 0;
                lastResponseLength = currentResponse.length;
            }
            
            // 检查是否有错误
            const errorMessage = document.querySelector(this.selectors.errorMessage);
            if (errorMessage && this.isElementInteractable(errorMessage)) {
                throw new Error(`Claude error: ${errorMessage.textContent}`);
            }
            
            await this.sleep(1000);
        }
        
        throw new Error('Claude response did not complete within timeout');
    }

    async extractResponse() {
        // 获取所有响应容器
        const responseElements = document.querySelectorAll(this.selectors.responseContainer);
        if (responseElements.length === 0) {
            throw new Error('No Claude response found');
        }
        
        // 找到最新的助手响应
        let latestResponse = null;
        for (let i = responseElements.length - 1; i >= 0; i--) {
            const element = responseElements[i];
            // 检查是否是助手的响应（不是用户的消息）
            if (!element.textContent.trim()) continue;
            
            // 简单的启发式判断：如果包含用户刚发送的内容，跳过
            const isUserMessage = element.querySelector('[data-role="user"]') || 
                                 element.closest('[data-role="user"]') ||
                                 element.classList.contains('user-message');
            
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
            '.message-content',
            '[data-testid="message-content"]',
            '.prose',
            '.markdown',
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
        
        if (!responseText) {
            throw new Error('Could not extract Claude response text');
        }
        
        return responseText;
    }

    async clearConversation() {
        this.log('info', 'Clearing Claude conversation...');
        
        try {
            const newChatButton = document.querySelector(this.selectors.newChatButton);
            if (newChatButton && this.isElementInteractable(newChatButton)) {
                await this.safeClick(newChatButton);
                await this.sleep(3000);
                
                // 等待新对话页面加载
                await this.waitForInputReady();
                
                this.log('info', 'Claude conversation cleared successfully');
                return true;
            } else {
                // 如果找不到新对话按钮，刷新页面
                window.location.reload();
                return true;
            }
        } catch (error) {
            this.log('error', 'Failed to clear Claude conversation', error);
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
                
                // 简单的角色判断逻辑
                const isUser = element.querySelector('[data-role="user"]') || 
                              element.closest('[data-role="user"]') ||
                              element.classList.contains('user-message') ||
                              index % 2 === 0; // 简单假设：偶数索引为用户消息
                
                messages.push({
                    role: isUser ? 'user' : 'assistant',
                    content,
                    timestamp: Date.now(),
                    index
                });
            });
            
            return messages;
        } catch (error) {
            this.log('error', 'Failed to get Claude conversation history', error);
            return [];
        }
    }
}

// 导出适配器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClaudeAdapter;
} else {
    window.ClaudeAdapter = ClaudeAdapter;
}