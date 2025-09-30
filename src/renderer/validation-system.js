/**
 * 输入验证系统 - 提供各种输入验证功能
 */
class ValidationSystem {
    constructor() {
        this.validators = new Map();
        this.initializeDefaultValidators();
    }

    // 初始化默认验证器
    initializeDefaultValidators() {
        // 必填验证
        this.addValidator('required', (value, options = {}) => {
            const isEmpty = value === null || value === undefined || 
                           (typeof value === 'string' && value.trim() === '') ||
                           (Array.isArray(value) && value.length === 0);
            
            return {
                valid: !isEmpty,
                message: options.message || '此字段为必填项'
            };
        });

        // 最小长度验证
        this.addValidator('minLength', (value, options = {}) => {
            const length = value ? value.toString().length : 0;
            const minLength = options.min || 0;
            
            return {
                valid: length >= minLength,
                message: options.message || `最少需要 ${minLength} 个字符`
            };
        });

        // 最大长度验证
        this.addValidator('maxLength', (value, options = {}) => {
            const length = value ? value.toString().length : 0;
            const maxLength = options.max || Infinity;
            
            return {
                valid: length <= maxLength,
                message: options.message || `最多允许 ${maxLength} 个字符`
            };
        });

        // 邮箱验证
        this.addValidator('email', (value, options = {}) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const isValid = !value || emailRegex.test(value);
            
            return {
                valid: isValid,
                message: options.message || '请输入有效的邮箱地址'
            };
        });

        // URL验证
        this.addValidator('url', (value, options = {}) => {
            try {
                if (!value) return { valid: true, message: '' };
                new URL(value);
                return { valid: true, message: '' };
            } catch {
                return {
                    valid: false,
                    message: options.message || '请输入有效的URL地址'
                };
            }
        });

        // 数字验证
        this.addValidator('number', (value, options = {}) => {
            const num = Number(value);
            const isValid = !value || (!isNaN(num) && isFinite(num));
            
            return {
                valid: isValid,
                message: options.message || '请输入有效的数字'
            };
        });

        // 范围验证
        this.addValidator('range', (value, options = {}) => {
            const num = Number(value);
            if (isNaN(num)) {
                return { valid: false, message: '请输入有效的数字' };
            }
            
            const min = options.min !== undefined ? options.min : -Infinity;
            const max = options.max !== undefined ? options.max : Infinity;
            const isValid = num >= min && num <= max;
            
            return {
                valid: isValid,
                message: options.message || `数值应在 ${min} 到 ${max} 之间`
            };
        });

        // 正则表达式验证
        this.addValidator('pattern', (value, options = {}) => {
            if (!value) return { valid: true, message: '' };
            
            const pattern = options.pattern;
            if (!pattern) {
                return { valid: false, message: '验证模式未定义' };
            }
            
            const regex = new RegExp(pattern);
            const isValid = regex.test(value);
            
            return {
                valid: isValid,
                message: options.message || '输入格式不正确'
            };
        });

        // 自定义函数验证
        this.addValidator('custom', (value, options = {}) => {
            if (typeof options.validator !== 'function') {
                return { valid: false, message: '自定义验证器未定义' };
            }
            
            try {
                const result = options.validator(value);
                if (typeof result === 'boolean') {
                    return {
                        valid: result,
                        message: options.message || '验证失败'
                    };
                }
                return result;
            } catch (error) {
                return {
                    valid: false,
                    message: '验证过程中发生错误'
                };
            }
        });
    }

    // 添加验证器
    addValidator(name, validator) {
        this.validators.set(name, validator);
    }

    // 验证单个值
    validateValue(value, rules) {
        const results = [];
        
        for (const rule of rules) {
            const validatorName = rule.type || rule.validator;
            const validator = this.validators.get(validatorName);
            
            if (!validator) {
                results.push({
                    valid: false,
                    message: `未知的验证器: ${validatorName}`,
                    rule
                });
                continue;
            }
            
            const result = validator(value, rule);
            results.push({
                ...result,
                rule
            });
            
            // 如果验证失败且设置了停止标志，则停止后续验证
            if (!result.valid && rule.stopOnFail) {
                break;
            }
        }
        
        return results;
    }

    // 验证表单
    validateForm(formData, schema) {
        const results = {};
        let isValid = true;
        
        for (const [fieldName, rules] of Object.entries(schema)) {
            const value = formData[fieldName];
            const fieldResults = this.validateValue(value, rules);
            
            results[fieldName] = {
                value,
                results: fieldResults,
                valid: fieldResults.every(r => r.valid),
                errors: fieldResults.filter(r => !r.valid).map(r => r.message)
            };
            
            if (!results[fieldName].valid) {
                isValid = false;
            }
        }
        
        return {
            valid: isValid,
            fields: results,
            errors: this.getFormErrors(results)
        };
    }

    // 获取表单错误信息
    getFormErrors(results) {
        const errors = [];
        
        for (const [fieldName, fieldResult] of Object.entries(results)) {
            if (!fieldResult.valid) {
                errors.push({
                    field: fieldName,
                    messages: fieldResult.errors
                });
            }
        }
        
        return errors;
    }

    // 实时验证表单字段
    setupRealTimeValidation(formElement, schema, options = {}) {
        const { 
            validateOnInput = true, 
            validateOnBlur = true,
            showErrorsImmediately = false,
            errorClass = 'validation-error',
            successClass = 'validation-success'
        } = options;

        const fieldElements = new Map();
        const fieldStates = new Map();

        // 收集表单字段
        for (const fieldName of Object.keys(schema)) {
            const element = formElement.querySelector(`[name="${fieldName}"]`);
            if (element) {
                fieldElements.set(fieldName, element);
                fieldStates.set(fieldName, { touched: false, valid: true });
            }
        }

        // 验证单个字段
        const validateField = (fieldName, showErrors = true) => {
            const element = fieldElements.get(fieldName);
            const rules = schema[fieldName];
            
            if (!element || !rules) return;

            const value = element.value;
            const results = this.validateValue(value, rules);
            const isValid = results.every(r => r.valid);
            const errors = results.filter(r => !r.valid).map(r => r.message);

            // 更新字段状态
            fieldStates.set(fieldName, {
                ...fieldStates.get(fieldName),
                valid: isValid,
                errors
            });

            // 更新UI
            if (showErrors || showErrorsImmediately) {
                this.updateFieldUI(element, isValid, errors, errorClass, successClass);
            }

            return { valid: isValid, errors };
        };

        // 绑定事件监听器
        for (const [fieldName, element] of fieldElements) {
            if (validateOnInput) {
                element.addEventListener('input', () => {
                    const state = fieldStates.get(fieldName);
                    validateField(fieldName, state.touched || showErrorsImmediately);
                });
            }

            if (validateOnBlur) {
                element.addEventListener('blur', () => {
                    fieldStates.set(fieldName, {
                        ...fieldStates.get(fieldName),
                        touched: true
                    });
                    validateField(fieldName, true);
                });
            }
        }

        // 返回验证控制对象
        return {
            validateField,
            validateAll: () => {
                let allValid = true;
                for (const fieldName of fieldElements.keys()) {
                    const result = validateField(fieldName, true);
                    if (!result.valid) {
                        allValid = false;
                    }
                }
                return allValid;
            },
            getFieldState: (fieldName) => fieldStates.get(fieldName),
            getAllStates: () => Object.fromEntries(fieldStates),
            clearErrors: () => {
                for (const [fieldName, element] of fieldElements) {
                    this.updateFieldUI(element, true, [], errorClass, successClass);
                }
            }
        };
    }

    // 更新字段UI
    updateFieldUI(element, isValid, errors, errorClass, successClass) {
        // 移除现有的验证类
        element.classList.remove(errorClass, successClass);
        
        // 添加新的验证类
        if (isValid) {
            element.classList.add(successClass);
        } else {
            element.classList.add(errorClass);
        }

        // 更新错误消息
        const errorContainer = element.parentNode.querySelector('.validation-message');
        if (errorContainer) {
            if (errors.length > 0) {
                errorContainer.textContent = errors[0]; // 显示第一个错误
                errorContainer.style.display = 'block';
            } else {
                errorContainer.style.display = 'none';
            }
        } else if (errors.length > 0) {
            // 创建错误消息容器
            const messageElement = document.createElement('div');
            messageElement.className = 'validation-message';
            messageElement.textContent = errors[0];
            element.parentNode.appendChild(messageElement);
        }
    }

    // 验证消息输入
    validateMessage(message) {
        const rules = [
            { type: 'required', message: '消息内容不能为空' },
            { type: 'minLength', min: 1, message: '消息内容不能为空' },
            { type: 'maxLength', max: 10000, message: '消息内容不能超过10000个字符' }
        ];

        const results = this.validateValue(message, rules);
        const isValid = results.every(r => r.valid);
        const errors = results.filter(r => !r.valid).map(r => r.message);

        if (!isValid && typeof errorHandler !== 'undefined') {
            errorHandler.handleValidationError('message', errors[0]);
        }

        return { valid: isValid, errors };
    }

    // 验证服务配置
    validateServiceConfig(config) {
        const schema = {
            name: [
                { type: 'required', message: '服务名称不能为空' },
                { type: 'minLength', min: 2, message: '服务名称至少需要2个字符' }
            ],
            url: [
                { type: 'required', message: 'URL不能为空' },
                { type: 'url', message: '请输入有效的URL地址' }
            ],
            adapter: [
                { type: 'required', message: '适配器类型不能为空' }
            ]
        };

        return this.validateForm(config, schema);
    }
}

// 添加验证样式
const validationStyles = `
<style>
.validation-error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
}

.validation-success {
    border-color: #28a745 !important;
    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25) !important;
}

.validation-message {
    color: #dc3545;
    font-size: 12px;
    margin-top: 4px;
    display: none;
}

.validation-message.show {
    display: block;
}

/* 深色主题适配 */
.dark-theme .validation-message {
    color: #f56565;
}
</style>
`;

// 注入样式
if (!document.getElementById('validation-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'validation-styles';
    styleElement.innerHTML = validationStyles;
    document.head.appendChild(styleElement);
}

// 创建全局实例
const validationSystem = new ValidationSystem();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationSystem;
}