/**
 * Config Loader - 加载 Widget 配置文件
 * 
 * 功能：
 * 1. 加载远程配置文件（JSON 格式）
 * 2. 缓存配置数据
 * 3. 验证配置格式
 * 4. 支持超时和重试
 */

import axios from 'axios';

class ConfigLoader {
  constructor() {
    // 配置缓存
    this.configCache = new Map();
    
    // 正在加载的 Promise
    this.loadingPromises = new Map();
    
    // 默认配置
    this.defaultOptions = {
      timeout: 10000,      // 超时时间 10 秒
      maxRetries: 3,       // 最大重试次数
      retryDelay: 1000     // 重试延迟 1 秒
    };
  }

  /**
   * 加载配置文件
   * @param {String} configUrl - 配置文件 URL
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} 配置对象
   */
  async loadConfig(configUrl, options = {}) {
    // 合并配置
    const config = { ...this.defaultOptions, ...options };
    
    // 如果已经缓存，直接返回
    if (this.configCache.has(configUrl)) {
      console.log(`[ConfigLoader] 配置已缓存: ${configUrl}`);
      return this.configCache.get(configUrl);
    }
    
    // 如果正在加载，返回现有的 Promise
    if (this.loadingPromises.has(configUrl)) {
      console.log(`[ConfigLoader] 配置正在加载中: ${configUrl}`);
      return this.loadingPromises.get(configUrl);
    }
    
    // 创建加载 Promise
    const loadPromise = this._loadWithRetry(configUrl, config);
    this.loadingPromises.set(configUrl, loadPromise);
    
    try {
      const configData = await loadPromise;
      
      // 验证配置格式
      this._validateConfig(configData, configUrl);
      
      // 缓存配置
      this.configCache.set(configUrl, configData);
      console.log(`[ConfigLoader] 配置加载成功: ${configUrl}`);
      
      return configData;
    } catch (error) {
      console.error(`[ConfigLoader] 配置加载失败: ${configUrl}`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(configUrl);
    }
  }

  /**
   * 带重试的加载
   * @param {String} configUrl - 配置文件 URL
   * @param {Object} config - 配置
   * @returns {Promise<Object>}
   */
  async _loadWithRetry(configUrl, config) {
    let lastError;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[ConfigLoader] 重试加载 (${attempt}/${config.maxRetries}): ${configUrl}`);
          await this._delay(config.retryDelay);
        }
        
        const response = await axios.get(configUrl, {
          timeout: config.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      } catch (error) {
        lastError = error;
        console.warn(`[ConfigLoader] 加载失败 (尝试 ${attempt + 1}/${config.maxRetries + 1}):`, error.message);
      }
    }
    
    throw new Error(`加载配置失败，已重试 ${config.maxRetries} 次: ${lastError.message}`);
  }

  /**
   * 验证配置格式
   * @param {Object} config - 配置对象
   * @param {String} configUrl - 配置文件 URL
   * @throws {Error} 如果配置格式无效
   */
  _validateConfig(config, configUrl) {
    // 必需字段
    const requiredFields = ['widgetId', 'componentName', 'layout'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`配置文件缺少必需字段 "${field}": ${configUrl}`);
      }
    }
    
    // 验证 layout 字段
    if (!config.layout.w || !config.layout.h) {
      throw new Error(`配置文件的 layout 缺少 w 或 h 字段: ${configUrl}`);
    }
    
    // 验证数值类型
    if (typeof config.layout.w !== 'number' || typeof config.layout.h !== 'number') {
      throw new Error(`配置文件的 layout.w 和 layout.h 必须是数字: ${configUrl}`);
    }
    
    // 验证数值范围
    if (config.layout.w <= 0 || config.layout.h <= 0) {
      throw new Error(`配置文件的 layout.w 和 layout.h 必须大于 0: ${configUrl}`);
    }
    
    console.log(`[ConfigLoader] 配置验证通过: ${configUrl}`);
  }

  /**
   * 批量加载配置
   * @param {Array<String>} configUrls - 配置文件 URL 数组
   * @param {Object} options - 配置选项
   * @returns {Promise<Array>}
   */
  async loadConfigs(configUrls, options = {}) {
    console.log(`[ConfigLoader] 批量加载 ${configUrls.length} 个配置`);
    
    const results = await Promise.allSettled(
      configUrls.map(url => this.loadConfig(url, options))
    );
    
    // 统计结果
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[ConfigLoader] 批量加载完成: 成功 ${succeeded}, 失败 ${failed}`);
    
    return results;
  }

  /**
   * 检查配置是否已缓存
   * @param {String} configUrl - 配置文件 URL
   * @returns {Boolean}
   */
  isCached(configUrl) {
    return this.configCache.has(configUrl);
  }

  /**
   * 获取缓存的配置
   * @param {String} configUrl - 配置文件 URL
   * @returns {Object|null}
   */
  getCached(configUrl) {
    return this.configCache.get(configUrl) || null;
  }

  /**
   * 清除缓存
   * @param {String} configUrl - 可选，指定要清除的 URL
   */
  clearCache(configUrl) {
    if (configUrl) {
      this.configCache.delete(configUrl);
      console.log(`[ConfigLoader] 清除缓存: ${configUrl}`);
    } else {
      this.configCache.clear();
      console.log(`[ConfigLoader] 清除所有缓存`);
    }
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
   * 获取加载统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      cachedCount: this.configCache.size,
      loadingCount: this.loadingPromises.size
    };
  }

  /**
   * 预加载配置
   * @param {Array<String>} configUrls - 配置文件 URL 数组
   */
  async preload(configUrls) {
    console.log(`[ConfigLoader] 预加载 ${configUrls.length} 个配置`);
    
    try {
      await this.loadConfigs(configUrls);
      console.log(`[ConfigLoader] 预加载完成`);
    } catch (error) {
      console.error(`[ConfigLoader] 预加载失败:`, error);
    }
  }
}

// 导出单例
export default new ConfigLoader();
