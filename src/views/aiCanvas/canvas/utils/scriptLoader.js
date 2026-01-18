/**
 * Script Loader - 动态加载 JavaScript 文件
 * 
 * 功能：
 * 1. 动态加载远程 JS 文件
 * 2. 缓存已加载的脚本，避免重复加载
 * 3. 支持并发控制
 * 4. 支持加载超时和重试机制
 */

class ScriptLoader {
  constructor() {
    // 已加载的脚本 URL 集合
    this.loadedScripts = new Set();
    
    // 正在加载的 Promise 映射
    this.loadingPromises = new Map();
    
    // 并发控制：最多同时加载 3 个脚本
    this.maxConcurrent = 3;
    this.currentLoading = 0;
    
    // 加载队列
    this.loadQueue = [];
    
    // 默认配置
    this.defaultOptions = {
      timeout: 30000,      // 超时时间 30 秒
      maxRetries: 3,       // 最大重试次数
      retryDelay: 1000     // 重试延迟 1 秒
    };
  }

  /**
   * 加载 JavaScript 文件
   * @param {String} url - JS 文件 URL
   * @param {Object} options - 配置选项
   * @returns {Promise<void>}
   */
  async loadScript(url, options = {}) {
    // 合并配置
    const config = { ...this.defaultOptions, ...options };
    
    // 如果已经加载过，直接返回
    if (this.loadedScripts.has(url)) {
      console.log(`[ScriptLoader] 脚本已加载: ${url}`);
      return Promise.resolve();
    }
    
    // 如果正在加载，返回现有的 Promise
    if (this.loadingPromises.has(url)) {
      console.log(`[ScriptLoader] 脚本正在加载中: ${url}`);
      return this.loadingPromises.get(url);
    }
    
    // 创建加载 Promise
    const loadPromise = this._loadWithRetry(url, config);
    this.loadingPromises.set(url, loadPromise);
    
    try {
      await loadPromise;
      this.loadedScripts.add(url);
      console.log(`[ScriptLoader] 脚本加载成功: ${url}`);
    } catch (error) {
      console.error(`[ScriptLoader] 脚本加载失败: ${url}`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * 带重试的加载
   * @param {String} url - JS 文件 URL
   * @param {Object} config - 配置
   * @returns {Promise<void>}
   */
  async _loadWithRetry(url, config) {
    let lastError;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[ScriptLoader] 重试加载 (${attempt}/${config.maxRetries}): ${url}`);
          await this._delay(config.retryDelay);
        }
        
        await this._loadScriptElement(url, config.timeout);
        return;
      } catch (error) {
        lastError = error;
        console.warn(`[ScriptLoader] 加载失败 (尝试 ${attempt + 1}/${config.maxRetries + 1}):`, error.message);
      }
    }
    
    throw new Error(`加载脚本失败，已重试 ${config.maxRetries} 次: ${lastError.message}`);
  }

  /**
   * 创建 script 标签并加载
   * @param {String} url - JS 文件 URL
   * @param {Number} timeout - 超时时间
   * @returns {Promise<void>}
   */
  _loadScriptElement(url, timeout) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = url;
      
      // 超时定时器
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`加载超时: ${url}`));
      }, timeout);
      
      // 清理函数
      const cleanup = () => {
        clearTimeout(timeoutId);
        script.onload = null;
        script.onerror = null;
      };
      
      // 加载成功
      script.onload = () => {
        cleanup();
        resolve();
      };
      
      // 加载失败
      script.onerror = () => {
        cleanup();
        // 移除失败的 script 标签
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        reject(new Error(`加载失败: ${url}`));
      };
      
      // 添加到 DOM
      document.head.appendChild(script);
    });
  }

  /**
   * 批量加载脚本
   * @param {Array<String>} urls - JS 文件 URL 数组
   * @param {Object} options - 配置选项
   * @returns {Promise<Array>}
   */
  async loadScripts(urls, options = {}) {
    console.log(`[ScriptLoader] 批量加载 ${urls.length} 个脚本`);
    
    const results = await Promise.allSettled(
      urls.map(url => this.loadScript(url, options))
    );
    
    // 统计结果
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[ScriptLoader] 批量加载完成: 成功 ${succeeded}, 失败 ${failed}`);
    
    return results;
  }

  /**
   * 检查脚本是否已加载
   * @param {String} url - JS 文件 URL
   * @returns {Boolean}
   */
  isLoaded(url) {
    return this.loadedScripts.has(url);
  }

  /**
   * 清除缓存
   * @param {String} url - 可选，指定要清除的 URL
   */
  clearCache(url) {
    if (url) {
      this.loadedScripts.delete(url);
      console.log(`[ScriptLoader] 清除缓存: ${url}`);
    } else {
      this.loadedScripts.clear();
      console.log(`[ScriptLoader] 清除所有缓存`);
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
      loadedCount: this.loadedScripts.size,
      loadingCount: this.loadingPromises.size,
      queuedCount: this.loadQueue.length
    };
  }
}

// 导出单例
export default new ScriptLoader();
