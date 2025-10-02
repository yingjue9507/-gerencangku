// 智能内存管理和性能监控功能测试脚本
// 在浏览器控制台中运行此脚本来测试新功能

console.log('🧪 开始测试智能内存管理和性能监控功能...');

// 测试内存优化器功能
function testMemoryOptimizer() {
    console.log('\n📊 测试内存优化器功能:');
    
    if (typeof memoryOptimizer !== 'undefined') {
        console.log('✅ 内存优化器已加载');
        
        // 测试自适应阈值
        const thresholds = memoryOptimizer.getAdaptiveThresholds();
        console.log('📈 当前自适应阈值:', thresholds);
        
        // 测试内存压力历史
        if (memoryOptimizer.memoryPressureHistory) {
            console.log('📚 内存压力历史记录数量:', memoryOptimizer.memoryPressureHistory.length);
        }
        
        // 测试清理效果记录
        if (memoryOptimizer.cleanupEffectiveness) {
            console.log('🧹 清理效果记录:', memoryOptimizer.cleanupEffectiveness);
        }
        
        // 测试webview内存跟踪
        if (memoryOptimizer.webviewMemoryTracking) {
            const webviewCount = Object.keys(memoryOptimizer.webviewMemoryTracking).length;
            console.log('🌐 正在跟踪的webview数量:', webviewCount);
        }
        
        // 测试获取最佳清理策略
        try {
            const bestStrategy = memoryOptimizer.getBestCleanupStrategy();
            console.log('🎯 最佳清理策略:', bestStrategy);
        } catch (e) {
            console.log('⚠️ 获取最佳清理策略失败:', e.message);
        }
        
    } else {
        console.log('❌ 内存优化器未加载');
    }
}

// 测试性能监控器功能
function testPerformanceMonitor() {
    console.log('\n📈 测试性能监控器功能:');
    
    if (typeof performanceMonitor !== 'undefined') {
        console.log('✅ 性能监控器已加载');
        
        // 测试异常检测
        try {
            const anomalies = performanceMonitor.detectAnomalies();
            console.log('🚨 检测到的异常:', anomalies);
        } catch (e) {
            console.log('⚠️ 异常检测失败:', e.message);
        }
        
        // 测试趋势分析
        try {
            const trends = performanceMonitor.analyzeTrends();
            console.log('📊 性能趋势分析:', trends);
        } catch (e) {
            console.log('⚠️ 趋势分析失败:', e.message);
        }
        
        // 测试智能报告
        try {
            const report = performanceMonitor.getIntelligentReport();
            console.log('📋 智能分析报告:', report);
        } catch (e) {
            console.log('⚠️ 获取智能报告失败:', e.message);
        }
        
        // 测试健康度计算
        try {
            const health = performanceMonitor.calculateOverallHealth();
            console.log('💚 系统整体健康度:', health + '%');
        } catch (e) {
            console.log('⚠️ 健康度计算失败:', e.message);
        }
        
        // 测试预测分析
        try {
            const predictions = performanceMonitor.generatePredictions();
            console.log('🔮 性能预测:', predictions);
        } catch (e) {
            console.log('⚠️ 预测分析失败:', e.message);
        }
        
    } else {
        console.log('❌ 性能监控器未加载');
    }
}

// 测试应用集成功能
function testAppIntegration() {
    console.log('\n🔗 测试应用集成功能:');
    
    if (typeof window.app !== 'undefined') {
        console.log('✅ 主应用已加载');
        
        // 测试保护模式
        if (typeof window.app.enableProtectionMode === 'function') {
            console.log('🛡️ 保护模式功能可用');
        } else {
            console.log('❌ 保护模式功能不可用');
        }
        
        // 测试系统健康状态更新
        if (typeof window.app.updateSystemHealthStatus === 'function') {
            console.log('💚 系统健康状态更新功能可用');
            // 测试更新健康状态
            window.app.updateSystemHealthStatus(85);
        } else {
            console.log('❌ 系统健康状态更新功能不可用');
        }
        
        // 检查智能分析是否正在运行
        if (window.app.intelligentAnalysisInterval) {
            console.log('🧠 智能分析定时器正在运行');
        } else {
            console.log('⚠️ 智能分析定时器未运行');
        }
        
    } else {
        console.log('❌ 主应用未加载');
    }
}

// 模拟内存压力测试
function simulateMemoryPressure() {
    console.log('\n🧪 模拟内存压力测试:');
    
    if (typeof memoryOptimizer !== 'undefined') {
        // 模拟高内存使用
        const mockMemoryUsage = 0.9; // 90%内存使用率
        console.log('📈 模拟内存使用率:', mockMemoryUsage * 100 + '%');
        
        try {
            memoryOptimizer.handleMemoryUsage(mockMemoryUsage);
            console.log('✅ 内存压力处理完成');
        } catch (e) {
            console.log('❌ 内存压力处理失败:', e.message);
        }
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有测试...\n');
    
    testMemoryOptimizer();
    testPerformanceMonitor();
    testAppIntegration();
    simulateMemoryPressure();
    
    console.log('\n✅ 所有测试完成！');
    console.log('💡 提示: 打开开发者工具的控制台查看详细日志');
}

// 自动运行测试
setTimeout(runAllTests, 1000);

// 导出测试函数供手动调用
window.testIntelligentFeatures = {
    runAllTests,
    testMemoryOptimizer,
    testPerformanceMonitor,
    testAppIntegration,
    simulateMemoryPressure
};

console.log('📝 测试脚本已加载，将在1秒后自动运行测试');
console.log('💡 您也可以手动调用: window.testIntelligentFeatures.runAllTests()');