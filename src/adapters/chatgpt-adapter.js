/**
 * ChatGPT适配器
 * 适配OpenAI ChatGPT网页版
 */
class ChatGPTAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.selectors = {
            // 输入框选择器
            messageInput: 'textarea[placeholder*="Message"], textarea[data-id="root"], #prompt-textarea',
            
            // 发送按钮选择器
            sendButton: 'button[data-testid="send-button"], button[aria-label*="Send"], [data-testid="send-button"]',
            
            // 响应容器选择器
            responseContainer: '[data-message-author-role="assistant"]',
            
            // 最新响应选择器
            latestResponse: '[data-message-author-role="assistant"]:last-child',
            
            // 加载指示器
            loadingIndicator: '.result-streaming, [data-testid*="loading"], .loading',
            
            // 新对话按钮
            newChatButton: 'a[href="/"], button[aria-label*="New chat"]',
            
            // 错误提示
            errorMessage: '[role="alert"], .error-message, [data-testid="error"]'
        };
    }

    async initialize() {
        this.log('info', 'Initializing ChatGPT adapter...');
        
        try {
            // 等待页面加载完成
            await this.waitForPageLoad();
            
            // 检查是否需要登录
            await this.checkLoginStatus();
            
            // 等待输入框出现
            await this.waitForInputReady();
            
            this.isInitialized = true;
            this.isReady = true;
            
            this.log('info', 'ChatGPT adapter initialized successfully');
            return true;
            
        } catch (error) {
            this.log('error', 'Failed to initialize ChatGPT adapter', error);
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
        
        // 等待React应用加载
        await this.sleep(2000);
    }

    async checkLoginStatus() {
        // 检查是否在登录页面
        if (window.location.pathname.includes('/auth') || 
            document.querySelector('button[data-testid="login-button"]')) {
            throw new Error('Please login to ChatGPT first');
        }
        
        // 检查是否有访问限制
        const antiAutomation = await this.detectAntiAutomation();
        if (antiAutomation.detected) {
            throw new Error(`Anti-automation detected: ${antiAutomation.type}`);
        }
    }

    async waitForInputReady() {
        // 尝试多个可能的输入框选择器
        const inputSelectors = this.selectors.messageInput.split(', ');
        
        for (const selector of inputSelectors) {
            try {
                const input = await this.waitForElement(selector, 5000);
                if (input) {
                    this.currentInputSelector = selector;
                    this.log('info', `Found input element with selector: ${selector}`);
                    return input;
                }
            } catch (error) {
                continue;
            }
        }
        
        throw new Error('Could not find message input element');
    }

    async checkReady() {
        try {
            const input = document.querySelector(this.currentInputSelector || this.selectors.messageInput);
            const sendButton = document.querySelector(this.selectors.sendButton);
            
            return !!(input && sendButton && !input.disabled);
        } catch (error) {
            this.log('error', 'Error checking ready status', error);
            return false;
        }
    }

    async sendMessage(message) {
        this.log('info', `Sending message: ${message.substring(0, 50)}...`);
        
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
            
            // 输入消息
            await this.safeInput(input, message);
            await this.sleep(500);
            
            // 点击发送按钮
            const sendButton = document.querySelector(this.selectors.sendButton);
            if (!sendButton) {
                // 尝试按Enter键发送
                input.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    bubbles: true
                }));
            } else {
                await this.safeClick(sendButton);
            }
            
            this.log('info', 'Message sent successfully');
            return true;
            
        } catch (error) {
            this.log('error', 'Failed to send message', error);
            throw error;
        }
    }

    async getResponse(timeout = 30000) {
        this.log('info', 'Waiting for response...');
        
        try {
            // 等待响应开始
            await this.waitForResponseStart();
            
            // 等待响应完成
            await this.waitForResponseComplete(timeout);
            
            // 获取最新响应内容
            const response = await this.extractResponse();
            
            this.log('info', `Response received: ${response.substring(0, 100)}...`);
            return response;
            
        } catch (error) {
            this.log('error', 'Failed to get response', error);
            throw error;
        }
    }

    async waitForResponseStart() {
        // 等待响应容器出现或加载指示器出现
        const startTime = Date.now();
        const timeout = 10000;
        
        while (Date.now() - startTime < timeout) {
            const responseContainer = document.querySelector(this.selectors.responseContainer);
            const loadingIndicator = document.querySelector(this.selectors.loadingIndicator);
            
            if (responseContainer || loadingIndicator) {
                return;
            }
            
            await this.sleep(100);
        }
        
        throw new Error('Response did not start within timeout');
    }

    async waitForResponseComplete(timeout) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            // 检查是否还在加载
            const loadingIndicator = document.querySelector(this.selectors.loadingIndicator);
            if (!loadingIndicator) {
                // 等待一点时间确保响应完全加载
                await this.sleep(1000);
                return;
            }
            
            // 检查是否有错误
            const errorMessage = document.querySelector(this.selectors.errorMessage);
            if (errorMessage) {
                throw new Error(`ChatGPT error: ${errorMessage.textContent}`);
            }
            
            await this.sleep(500);
        }
        
        throw new Error('Response did not complete within timeout');
    }

    async extractResponse() {
        // 获取最新的助手响应
        const responseElements = document.querySelectorAll(this.selectors.responseContainer);
        if (responseElements.length === 0) {
            throw new Error('No response found');
        }
        
        const latestResponse = responseElements[responseElements.length - 1];
        
        // 提取文本内容
        let responseText = '';
        
        // 尝试不同的内容提取方法
        const contentSelectors = [
            '.markdown',
            '[data-message-content]',
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
        
        if (!responseText) {
            throw new Error('Could not extract response text');
        }
        
        return responseText;
    }

    async clearConversation() {
        this.log('info', 'Clearing conversation...');
        
        try {
            const newChatButton = document.querySelector(this.selectors.newChatButton);
            if (newChatButton) {
                await this.safeClick(newChatButton);
                await this.sleep(2000);
                
                // 等待新对话页面加载
                await this.waitForInputReady();
                
                this.log('info', 'Conversation cleared successfully');
                return true;
            } else {
                // 如果找不到新对话按钮，刷新页面
                window.location.reload();
                return true;
            }
        } catch (error) {
            this.log('error', 'Failed to clear conversation', error);
            throw error;
        }
    }

    async getConversationHistory() {
        try {
            const messages = [];
            
            // 获取所有消息元素
            const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
            const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
            
            // 合并并排序消息
            const allMessages = [...userMessages, ...assistantMessages];
            allMessages.sort((a, b) => {
                const aIndex = Array.from(a.parentNode.children).indexOf(a);
                const bIndex = Array.from(b.parentNode.children).indexOf(b);
                return aIndex - bIndex;
            });
            
            allMessages.forEach(element => {
                const role = element.getAttribute('data-message-author-role');
                const content = element.textContent.trim();
                
                if (content) {
                    messages.push({
                        role,
                        content,
                        timestamp: Date.now()
                    });
                }
            });
            
            return messages;
        } catch (error) {
            this.log('error', 'Failed to get conversation history', error);
            return [];
        }
    }
}

// 导出适配器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatGPTAdapter;
} else {
    window.ChatGPTAdapter = ChatGPTAdapter;
}