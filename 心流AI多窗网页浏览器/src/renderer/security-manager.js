/**
 * 安全配置管理器
 * 统一管理webview的安全设置和反检测机制
 */
class SecurityManager {
    constructor() {
        this.config = {
            // 基础安全配置
            enableAntiDetection: true,
            enableFingerprinting: true,
            enableAdvancedStealth: true,
            
            // 用户代理配置
            userAgents: {
                chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
                firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
            },
            
            // 反检测配置
            antiDetectionFeatures: {
                hideWebdriver: true,
                spoofPlugins: true,
                spoofCanvas: true,
                spoofWebGL: true,
                spoofAudio: true,
                spoofTimezone: true,
                spoofLanguage: true,
                spoofScreen: true,
                spoofMemory: true,
                spoofPermissions: true
            },
            
            // 服务特定配置
            serviceConfigs: {
                google: {
                    webSecurity: true,
                    userAgent: 'chrome',
                    antiDetectionLevel: 'high'
                },
                openai: {
                    webSecurity: false,
                    userAgent: 'chrome',
                    antiDetectionLevel: 'medium'
                },
                anthropic: {
                    webSecurity: false,
                    userAgent: 'chrome',
                    antiDetectionLevel: 'medium'
                },
                default: {
                    webSecurity: false,
                    userAgent: 'chrome',
                    antiDetectionLevel: 'medium'
                }
            }
        };
        
        this.loadConfig();
    }

    /**
     * 加载安全配置
     */
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('security-config');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsed };
            }
        } catch (error) {
            console.warn('加载安全配置失败，使用默认配置:', error);
        }
    }

    /**
     * 保存安全配置
     */
    saveConfig() {
        try {
            localStorage.setItem('security-config', JSON.stringify(this.config));
        } catch (error) {
            console.error('保存安全配置失败:', error);
        }
    }

    /**
     * 获取服务的安全配置
     */
    getServiceConfig(service) {
        const serviceName = this.getServiceName(service);
        return this.config.serviceConfigs[serviceName] || this.config.serviceConfigs.default;
    }

    /**
     * 获取服务名称
     */
    getServiceName(service) {
        if (!service || !service.url) return 'default';
        
        const url = service.url.toLowerCase();
        if (url.includes('google.com') || url.includes('gemini.google.com')) {
            return 'google';
        } else if (url.includes('openai.com') || url.includes('chatgpt.com')) {
            return 'openai';
        } else if (url.includes('anthropic.com') || url.includes('claude.ai')) {
            return 'anthropic';
        }
        
        return 'default';
    }

    /**
     * 配置webview安全设置
     */
    configureWebview(webview, service) {
        const serviceConfig = this.getServiceConfig(service);
        
        // 设置基础属性
        webview.setAttribute('nodeintegration', 'false');
        webview.setAttribute('contextIsolation', 'true');
        webview.setAttribute('websecurity', serviceConfig.webSecurity ? 'true' : 'false');
        
        // 设置用户代理
        const userAgent = this.config.userAgents[serviceConfig.userAgent] || this.config.userAgents.chrome;
        webview.setAttribute('useragent', userAgent);
        
        // 设置webview预加载参数
        const webPreferences = [
            'contextIsolation=true',
            'nodeIntegration=false',
            'sandbox=false',
            'spellcheck=false',
            'backgroundThrottling=false',
            `webSecurity=${serviceConfig.webSecurity}`
        ].join(',');
        
        webview.setAttribute('webpreferences', webPreferences);
        
        console.log(`为${service.name}配置安全设置: webSecurity=${serviceConfig.webSecurity}, userAgent=${serviceConfig.userAgent}`);
    }

    /**
     * 注入反检测脚本
     */
    injectAntiDetection(webview, service) {
        if (!this.config.enableAntiDetection) return;
        
        const serviceConfig = this.getServiceConfig(service);
        const level = serviceConfig.antiDetectionLevel;
        
        // 根据级别选择注入的脚本
        if (level === 'high') {
            this.injectAdvancedAntiDetection(webview, service);
        } else if (level === 'medium') {
            this.injectBasicAntiDetection(webview, service);
        }
    }

    /**
     * 注入基础反检测脚本
     */
    injectBasicAntiDetection(webview, service) {
        const script = `
            (function() {
                // 隐藏webdriver特征
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                    configurable: true
                });
                
                // 隐藏自动化工具特征
                window.chrome = window.chrome || {};
                window.chrome.runtime = window.chrome.runtime || {};
                
                // 移除webview相关的全局变量
                delete window.webview;
                delete window.electron;
                delete window.electronAPI;
                
                // 移除自动化检测标记
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
                
                console.log('基础反检测脚本已注入');
            })();
        `;
        
        this.executeScript(webview, script, `${service.name} 基础反检测`);
    }

    /**
     * 注入高级反检测脚本
     */
    injectAdvancedAntiDetection(webview, service) {
        const features = this.config.antiDetectionFeatures;
        
        const script = `
            (function() {
                ${features.hideWebdriver ? this.getWebdriverHidingScript() : ''}
                ${features.spoofPlugins ? this.getPluginSpoofingScript() : ''}
                ${features.spoofCanvas ? this.getCanvasSpoofingScript() : ''}
                ${features.spoofWebGL ? this.getWebGLSpoofingScript() : ''}
                ${features.spoofAudio ? this.getAudioSpoofingScript() : ''}
                ${features.spoofTimezone ? this.getTimezoneSpoofingScript() : ''}
                ${features.spoofLanguage ? this.getLanguageSpoofingScript() : ''}
                ${features.spoofScreen ? this.getScreenSpoofingScript() : ''}
                ${features.spoofMemory ? this.getMemorySpoofingScript() : ''}
                ${features.spoofPermissions ? this.getPermissionSpoofingScript() : ''}
                
                console.log('高级反检测脚本已注入');
            })();
        `;
        
        this.executeScript(webview, script, `${service.name} 高级反检测`);
    }

    /**
     * 获取webdriver隐藏脚本
     */
    getWebdriverHidingScript() {
        return `
            // 隐藏webdriver特征
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
                configurable: true
            });
            
            // 移除自动化检测标记
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
            
            // 移除webview相关变量
            delete window.webview;
            delete window.electron;
            delete window.electronAPI;
        `;
    }

    /**
     * 获取插件伪装脚本
     */
    getPluginSpoofingScript() {
        return `
            // 伪装插件信息
            Object.defineProperty(navigator, 'plugins', {
                get: () => {
                    const plugins = [
                        {
                            name: 'Chrome PDF Plugin',
                            filename: 'internal-pdf-viewer',
                            description: 'Portable Document Format'
                        },
                        {
                            name: 'Chrome PDF Viewer',
                            filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
                            description: ''
                        },
                        {
                            name: 'Native Client',
                            filename: 'internal-nacl-plugin',
                            description: ''
                        }
                    ];
                    return plugins;
                },
                configurable: true
            });
        `;
    }

    /**
     * 获取Canvas伪装脚本
     */
    getCanvasSpoofingScript() {
        return `
            // Canvas指纹伪装
            const originalGetContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
                const context = originalGetContext.call(this, contextType, contextAttributes);
                
                if (contextType === '2d') {
                    const originalFillText = context.fillText;
                    context.fillText = function(text, x, y, maxWidth) {
                        const offset = Math.random() * 0.1 - 0.05;
                        return originalFillText.call(this, text, x + offset, y + offset, maxWidth);
                    };
                }
                
                return context;
            };
        `;
    }

    /**
     * 获取WebGL伪装脚本
     */
    getWebGLSpoofingScript() {
        return `
            // WebGL指纹伪装
            const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function(parameter) {
                if (parameter === this.RENDERER) {
                    return 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)';
                }
                if (parameter === this.VENDOR) {
                    return 'Google Inc. (Intel)';
                }
                return originalGetParameter.call(this, parameter);
            };
        `;
    }

    /**
     * 获取音频伪装脚本
     */
    getAudioSpoofingScript() {
        return `
            // AudioContext指纹伪装
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                const originalCreateAnalyser = AudioContextClass.prototype.createAnalyser;
                AudioContextClass.prototype.createAnalyser = function() {
                    const analyser = originalCreateAnalyser.call(this);
                    const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
                    analyser.getFloatFrequencyData = function(array) {
                        originalGetFloatFrequencyData.call(this, array);
                        for (let i = 0; i < array.length; i++) {
                            array[i] += Math.random() * 0.001 - 0.0005;
                        }
                    };
                    return analyser;
                };
            }
        `;
    }

    /**
     * 获取时区伪装脚本
     */
    getTimezoneSpoofingScript() {
        return `
            // 时区检测对抗
            const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
            Date.prototype.getTimezoneOffset = function() {
                return -480; // 固定为中国时区 UTC+8
            };
        `;
    }

    /**
     * 获取语言伪装脚本
     */
    getLanguageSpoofingScript() {
        return `
            // 语言检测增强
            Object.defineProperty(navigator, 'language', {
                get: () => 'zh-CN',
                configurable: true
            });
            
            Object.defineProperty(navigator, 'languages', {
                get: () => ['zh-CN', 'zh', 'en'],
                configurable: true
            });
        `;
    }

    /**
     * 获取屏幕伪装脚本
     */
    getScreenSpoofingScript() {
        return `
            // 屏幕分辨率伪装
            Object.defineProperty(screen, 'width', {
                get: () => 1920,
                configurable: true
            });
            
            Object.defineProperty(screen, 'height', {
                get: () => 1080,
                configurable: true
            });
            
            Object.defineProperty(screen, 'availWidth', {
                get: () => 1920,
                configurable: true
            });
            
            Object.defineProperty(screen, 'availHeight', {
                get: () => 1040,
                configurable: true
            });
        `;
    }

    /**
     * 获取内存伪装脚本
     */
    getMemorySpoofingScript() {
        return `
            // 内存信息伪装
            if (performance.memory) {
                Object.defineProperty(performance.memory, 'jsHeapSizeLimit', {
                    get: () => 2172649472,
                    configurable: true
                });
                
                Object.defineProperty(performance.memory, 'totalJSHeapSize', {
                    get: () => Math.floor(Math.random() * 100000000) + 50000000,
                    configurable: true
                });
                
                Object.defineProperty(performance.memory, 'usedJSHeapSize', {
                    get: () => Math.floor(Math.random() * 50000000) + 20000000,
                    configurable: true
                });
            }
        `;
    }

    /**
     * 获取权限伪装脚本
     */
    getPermissionSpoofingScript() {
        return `
            // 权限API伪装
            if (navigator.permissions) {
                const originalQuery = navigator.permissions.query;
                navigator.permissions.query = function(permissionDesc) {
                    if (permissionDesc.name === 'notifications') {
                        return Promise.resolve({ state: 'granted' });
                    }
                    return originalQuery.call(this, permissionDesc);
                };
            }
            
            // Notification API伪装
            if (window.Notification) {
                Object.defineProperty(Notification, 'permission', {
                    get: () => 'granted',
                    configurable: true
                });
            }
        `;
    }

    /**
     * 执行脚本
     */
    executeScript(webview, script, description) {
        try {
            webview.executeJavaScript(script);
            console.log(`${description}注入完成`);
        } catch (error) {
            console.error(`${description}注入失败:`, error);
        }
    }

    /**
     * 检测安全威胁
     */
    detectSecurityThreats(webview, service) {
        const detectionScript = `
            (function() {
                const threats = [];
                
                // 检测验证码
                if (document.querySelector('iframe[src*="captcha"]') || 
                    document.querySelector('[class*="captcha"]') ||
                    document.querySelector('[id*="captcha"]')) {
                    threats.push({ type: 'captcha', severity: 'medium' });
                }
                
                // 检测反机器人检测
                if (document.querySelector('[class*="cloudflare"]') ||
                    document.querySelector('[class*="challenge"]') ||
                    document.querySelector('[id*="challenge"]')) {
                    threats.push({ type: 'anti-bot', severity: 'high' });
                }
                
                // 检测访问被阻止
                if (document.querySelector('[class*="blocked"]') ||
                    document.querySelector('[class*="forbidden"]') ||
                    document.body.textContent.includes('Access denied') ||
                    document.body.textContent.includes('Forbidden')) {
                    threats.push({ type: 'blocked', severity: 'high' });
                }
                
                return threats;
            })();
        `;
        
        webview.executeJavaScript(detectionScript).then(threats => {
            if (threats && threats.length > 0) {
                console.warn(`${service.name}检测到安全威胁:`, threats);
                this.handleSecurityThreats(webview, service, threats);
            }
        }).catch(error => {
            console.error('安全威胁检测失败:', error);
        });
    }

    /**
     * 处理安全威胁
     */
    handleSecurityThreats(webview, service, threats) {
        threats.forEach(threat => {
            switch (threat.type) {
                case 'captcha':
                    console.log(`${service.name}遇到验证码，可能需要用户干预`);
                    break;
                case 'anti-bot':
                    console.log(`${service.name}遇到反机器人检测，尝试重新加载`);
                    setTimeout(() => {
                        webview.reload();
                    }, 5000);
                    break;
                case 'blocked':
                    console.log(`${service.name}访问被阻止，可能需要更换策略`);
                    break;
            }
        });
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    }

    /**
     * 获取配置
     */
    getConfig() {
        return { ...this.config };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
} else {
    window.SecurityManager = SecurityManager;
}