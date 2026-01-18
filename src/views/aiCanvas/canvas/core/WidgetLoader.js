/**
 * Widget Loader - Widget 加载器
 * 
 * 功能：
 * 1. 加载 Widget JS 文件和配置文件
 * 2. 注册 Vue 组件
 * 3. 管理加载状态
 * 4. 提供加载进度反馈
 */

import Vue from 'vue';
import scriptLoader from '../utils/scriptLoader';
import configLoader from '../utils/configLoader';

class WidgetLoader {
  constructor() {
    // 已注册的组件名称集合
    this.registeredComponents = new Set();
    
    // 加载状态映射：widgetId -> 'loading' | 'loaded' | 'failed'
    this.loadingStates = new Map();
    
    // 组件定义缓存：componentName -> component definition
    this.componentCache = new Map();
    
    console.log(`[WidgetLoader] 初始化完成`);
  }

  /**
   * 加载 Widget（包括 JS 和配置）
   * @param {Object} widgetConfig - Widget 配置
   * @param {String} widgetConfig.widgetId - Widget ID
   * @param {String} widgetConfig.componentName - 组件名称
   * @param {String} widgetConfig.jsUrl - JS 文件 URL
   * @param {String} widgetConfig.configUrl - 配置文件 URL
   * @returns {Promise<Object>} 包含配置和组件信息
   */
  async loadWidget(widgetConfig) {
    const { widgetId, componentName, jsUrl, configUrl } = widgetConfig;
    
    console.log(`[WidgetLoader] 开始加载 Widget: ${widgetId}`);
    this.loadingStates.set(widgetId, 'loading');
    
    try {
      // 并行加载 JS 和配置文件
      const [, config] = await Promise.all([
        this._loadAndRegisterComponent(componentName, jsUrl),
        configLoader.loadConfig(configUrl)
      ]);
      
      this.loadingStates.set(widgetId, 'loaded');
      console.log(`[WidgetLoader] Widget 加载成功: ${widgetId}`);
      
      return {
        widgetId,
        componentName,
        config,
        loaded: true
      };
    } catch (error) {
      this.loadingStates.set(widgetId, 'failed');
      console.error(`[WidgetLoader] Widget 加载失败: ${widgetId}`, error);
      throw new Error(`Widget 加载失败 (${widgetId}): ${error.message}`);
    }
  }

  /**
   * 加载并注册组件
   * @param {String} componentName - 组件名称
   * @param {String} jsUrl - JS 文件 URL
   * @returns {Promise<void>}
   */
  async _loadAndRegisterComponent(componentName, jsUrl) {
    // 如果组件已注册，直接返回
    if (this.isComponentRegistered(componentName)) {
      console.log(`[WidgetLoader] 组件已注册: ${componentName}`);
      return;
    }
    
    // 加载 JS 文件
    await scriptLoader.loadScript(jsUrl);
    
    // 从全局对象获取组件定义
    const componentDef = this._getComponentFromGlobal(componentName);
    
    if (!componentDef) {
      throw new Error(`无法从全局对象获取组件定义: ${componentName}`);
    }
    
    // 注册 Vue 组件
    this.registerComponent(componentName, componentDef);
  }

  /**
   * 从全局对象获取组件定义
   * @param {String} componentName - 组件名称
   * @returns {Object|null} 组件定义
   */
  _getComponentFromGlobal(componentName) {
    // 尝试从 window 对象获取
    if (window[componentName]) {
      return window[componentName];
    }
    
    // 尝试从 window.__WIDGETS__ 获取（如果有统一的命名空间）
    if (window.__WIDGETS__ && window.__WIDGETS__[componentName]) {
      return window.__WIDGETS__[componentName];
    }
    
    return null;
  }

  /**
   * 注册 Vue 组件
   * @param {String} componentName - 组件名称
   * @param {Object} componentDef - 组件定义
   */
  registerComponent(componentName, componentDef) {
    // 检查是否已注册
    if (this.registeredComponents.has(componentName)) {
      console.warn(`[WidgetLoader] 组件已注册，跳过: ${componentName}`);
      return;
    }
    
    try {
      // 注册全局组件
      Vue.component(componentName, componentDef);
      
      // 记录已注册
      this.registeredComponents.add(componentName);
      this.componentCache.set(componentName, componentDef);
      
      console.log(`[WidgetLoader] 组件注册成功: ${componentName}`);
    } catch (error) {
      console.error(`[WidgetLoader] 组件注册失败: ${componentName}`, error);
      throw error;
    }
  }

  /**
   * 检查组件是否已注册
   * @param {String} componentName - 组件名称
   * @returns {Boolean}
   */
  isComponentRegistered(componentName) {
    return this.registeredComponents.has(componentName);
  }

  /**
   * 批量加载 Widget
   * @param {Array} widgetConfigs - Widget 配置数组
   * @param {Function} onProgress - 进度回调 (loaded, total)
   * @returns {Promise<Array>} 加载结果数组
   */
  async loadWidgets(widgetConfigs, onProgress = null) {
    console.log(`[WidgetLoader] 批量加载 ${widgetConfigs.length} 个 Widget`);
    
    const results = [];
    let loaded = 0;
    
    for (const widgetConfig of widgetConfigs) {
      try {
        const result = await this.loadWidget(widgetConfig);
        results.push({ status: 'fulfilled', value: result });
      } catch (error) {
        results.push({ status: 'rejected', reason: error });
      }
      
      loaded++;
      
      // 调用进度回调
      if (onProgress) {
        onProgress(loaded, widgetConfigs.length);
      }
    }
    
    // 统计结果
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[WidgetLoader] 批量加载完成: 成功 ${succeeded}, 失败 ${failed}`);
    
    return results;
  }

  /**
   * 并发加载 Widget（限制并发数）
   * @param {Array} widgetConfigs - Widget 配置数组
   * @param {Number} concurrency - 并发数，默认 3
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Array>} 加载结果数组
   */
  async loadWidgetsConcurrent(widgetConfigs, concurrency = 3, onProgress = null) {
    console.log(`[WidgetLoader] 并发加载 ${widgetConfigs.length} 个 Widget (并发数: ${concurrency})`);
    
    const results = [];
    let loaded = 0;
    let index = 0;
    
    // 创建并发任务池
    const pool = [];
    
    const loadNext = async () => {
      if (index >= widgetConfigs.length) {
        return;
      }
      
      const currentIndex = index++;
      const widgetConfig = widgetConfigs[currentIndex];
      
      try {
        const result = await this.loadWidget(widgetConfig);
        results[currentIndex] = { status: 'fulfilled', value: result };
      } catch (error) {
        results[currentIndex] = { status: 'rejected', reason: error };
      }
      
      loaded++;
      
      // 调用进度回调
      if (onProgress) {
        onProgress(loaded, widgetConfigs.length);
      }
      
      // 继续加载下一个
      await loadNext();
    };
    
    // 启动初始并发任务
    for (let i = 0; i < Math.min(concurrency, widgetConfigs.length); i++) {
      pool.push(loadNext());
    }
    
    // 等待所有任务完成
    await Promise.all(pool);
    
    // 统计结果
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[WidgetLoader] 并发加载完成: 成功 ${succeeded}, 失败 ${failed}`);
    
    return results;
  }

  /**
   * 获取加载状态
   * @param {String} widgetId - Widget ID
   * @returns {String} 'loading' | 'loaded' | 'failed' | 'unknown'
   */
  getLoadingState(widgetId) {
    return this.loadingStates.get(widgetId) || 'unknown';
  }

  /**
   * 获取所有已注册的组件名称
   * @returns {Array<String>}
   */
  getRegisteredComponents() {
    return Array.from(this.registeredComponents);
  }

  /**
   * 清除缓存
   */
  clearCache() {
    // 注意：已注册的 Vue 组件无法注销，只能清除记录
    this.registeredComponents.clear();
    this.loadingStates.clear();
    this.componentCache.clear();
    
    // 清除 scriptLoader 和 configLoader 的缓存
    scriptLoader.clearCache();
    configLoader.clearCache();
    
    console.log(`[WidgetLoader] 清除缓存完成`);
  }

  /**
   * 获取加载统计信息
   * @returns {Object}
   */
  getStats() {
    const states = {
      loading: 0,
      loaded: 0,
      failed: 0
    };
    
    for (const state of this.loadingStates.values()) {
      if (states[state] !== undefined) {
        states[state]++;
      }
    }
    
    return {
      registeredComponents: this.registeredComponents.size,
      ...states,
      scriptStats: scriptLoader.getStats(),
      configStats: configLoader.getStats()
    };
  }

  /**
   * 预加载常用 Widget
   * @param {Array} widgetConfigs - Widget 配置数组
   */
  async preload(widgetConfigs) {
    console.log(`[WidgetLoader] 预加载 ${widgetConfigs.length} 个 Widget`);
    
    try {
      await this.loadWidgetsConcurrent(widgetConfigs, 3);
      console.log(`[WidgetLoader] 预加载完成`);
    } catch (error) {
      console.error(`[WidgetLoader] 预加载失败:`, error);
    }
  }
}

// 导出单例
export default new WidgetLoader();
