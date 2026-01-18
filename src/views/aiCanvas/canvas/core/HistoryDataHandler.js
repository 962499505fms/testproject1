/**
 * History Data Handler - 历史数据处理器
 * 
 * 功能：
 * 1. 处理历史数据的批量加载
 * 2. 分批渲染，避免阻塞主线程
 * 3. 提供加载进度反馈
 * 4. 优化性能
 */

class HistoryDataHandler {
  constructor(widgetManager) {
    this.widgetManager = widgetManager;
    
    // 默认配置
    this.defaultOptions = {
      batchSize: 5,        // 每批渲染数量
      batchDelay: 100      // 批次间延迟（毫秒）
    };
    
    console.log(`[HistoryDataHandler] 初始化完成`);
  }

  /**
   * 加载历史数据
   * @param {Array} historyData - 历史数据数组
   * @param {Function} onProgress - 进度回调 (loaded, total, percentage)
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} 加载结果
   */
  async loadHistoryData(historyData, onProgress = null, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    const total = historyData.length;
    
    console.log(`[HistoryDataHandler] 开始加载历史数据: ${total} 个 Widget`);
    
    const startTime = Date.now();
    const results = {
      total,
      succeeded: 0,
      failed: 0,
      widgets: [],
      errors: []
    };
    
    try {
      // 分批渲染
      await this.renderInBatches(historyData, config.batchSize, config.batchDelay, (loaded) => {
        const percentage = Math.round((loaded / total) * 100);
        
        // 调用进度回调
        if (onProgress) {
          onProgress(loaded, total, percentage);
        }
        
        console.log(`[HistoryDataHandler] 加载进度: ${loaded}/${total} (${percentage}%)`);
      });
      
      // 统计结果
      const allWidgets = this.widgetManager.getAllWidgets();
      results.succeeded = allWidgets.length;
      results.widgets = allWidgets;
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`[HistoryDataHandler] 历史数据加载完成: 成功 ${results.succeeded}/${total}, 耗时 ${duration}ms`);
      
      return results;
    } catch (error) {
      console.error(`[HistoryDataHandler] 历史数据加载失败:`, error);
      throw error;
    }
  }

  /**
   * 分批渲染
   * @param {Array} data - 数据数组
   * @param {Number} batchSize - 批次大小
   * @param {Number} batchDelay - 批次间延迟
   * @param {Function} onBatchComplete - 批次完成回调
   * @returns {Promise<void>}
   */
  async renderInBatches(data, batchSize, batchDelay, onBatchComplete = null) {
    const batches = this._splitIntoBatches(data, batchSize);
    let loaded = 0;
    
    console.log(`[HistoryDataHandler] 分批渲染: ${batches.length} 批, 每批 ${batchSize} 个`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      console.log(`[HistoryDataHandler] 渲染第 ${i + 1}/${batches.length} 批`);
      
      // 并行加载当前批次
      await Promise.allSettled(
        batch.map(widgetConfig => this.widgetManager.loadWidget(widgetConfig))
      );
      
      loaded += batch.length;
      
      // 调用批次完成回调
      if (onBatchComplete) {
        onBatchComplete(loaded);
      }
      
      // 批次间延迟，避免阻塞主线程
      if (i < batches.length - 1) {
        await this._delay(batchDelay);
      }
    }
  }

  /**
   * 将数组分割成批次
   * @param {Array} array - 数组
   * @param {Number} batchSize - 批次大小
   * @returns {Array<Array>} 批次数组
   */
  _splitIntoBatches(array, batchSize) {
    const batches = [];
    
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * 延迟函数
   * @param {Number} ms - 延迟毫秒数
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 预加载历史数据（不渲染，只加载资源）
   * @param {Array} historyData - 历史数据数组
   * @returns {Promise<void>}
   */
  async preloadHistoryData(historyData) {
    console.log(`[HistoryDataHandler] 预加载历史数据: ${historyData.length} 个 Widget`);
    
    // 提取所有 JS 和配置文件 URL
    const jsUrls = [];
    const configUrls = [];
    
    for (const widgetConfig of historyData) {
      if (widgetConfig.jsUrl) {
        jsUrls.push(widgetConfig.jsUrl);
      }
      if (widgetConfig.configUrl) {
        configUrls.push(widgetConfig.configUrl);
      }
    }
    
    // 并行预加载
    await Promise.allSettled([
      ...jsUrls.map(url => this.widgetManager.loader.loader.loadScript(url)),
      ...configUrls.map(url => this.widgetManager.loader.loader.loadConfig(url))
    ]);
    
    console.log(`[HistoryDataHandler] 预加载完成`);
  }

  /**
   * 增量加载（用于实时推送场景）
   * @param {Object} widgetConfig - Widget 配置
   * @param {Boolean} withAnimation - 是否显示动画
   * @returns {Promise<Object>} Widget 实例
   */
  async loadIncremental(widgetConfig, withAnimation = true) {
    console.log(`[HistoryDataHandler] 增量加载 Widget: ${widgetConfig.surfaceId}`);
    
    try {
      // 加载 Widget
      const widget = await this.widgetManager.loadWidget(widgetConfig);
      
      // 如果需要动画，添加动画标记
      if (withAnimation) {
        widget.enterAnimation = true;
      }
      
      return widget;
    } catch (error) {
      console.error(`[HistoryDataHandler] 增量加载失败:`, error);
      throw error;
    }
  }

  /**
   * 获取加载统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      widgetCount: this.widgetManager.widgets.size,
      ...this.widgetManager.getStats()
    };
  }
}

export default HistoryDataHandler;
