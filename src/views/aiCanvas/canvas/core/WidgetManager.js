/**
 * Widget Manager - Widget 核心管理器
 * 
 * 功能：
 * 1. 统一管理 Widget 的生命周期
 * 2. 协调加载器、布局计算器等模块
 * 3. 维护 Widget 实例状态
 * 4. 提供 Widget 的 CRUD 操作
 */

import widgetLoader from './WidgetLoader';
import LayoutCalculator from './LayoutCalculator';

class WidgetManager {
  constructor(options = {}) {
    // Widget 实例映射：surfaceId -> widget instance
    this.widgets = new Map();
    
    // 布局计算器
    this.layoutCalculator = new LayoutCalculator({
      colNum: options.colNum || 12,
      margin: options.margin || 8
    });
    
    // Widget 加载器（使用单例）
    this.loader = widgetLoader;
    
    // 数据模型：surfaceId -> data model
    this.dataModels = new Map();
    
    // 事件监听器
    this.eventListeners = {
      widgetAdded: [],
      widgetUpdated: [],
      widgetRemoved: [],
      widgetError: []
    };
    
    console.log(`[WidgetManager] 初始化完成`);
  }

  /**
   * 加载单个 Widget
   * @param {Object} widgetConfig - Widget 配置
   * @param {String} widgetConfig.surfaceId - Surface ID
   * @param {String} widgetConfig.widgetId - Widget ID
   * @param {String} widgetConfig.componentName - 组件名称
   * @param {String} widgetConfig.jsUrl - JS 文件 URL
   * @param {String} widgetConfig.configUrl - 配置文件 URL
   * @param {Object} widgetConfig.data - Widget 数据（可选）
   * @returns {Promise<Object>} Widget 实例
   */
  async loadWidget(widgetConfig) {
    const { surfaceId, widgetId, componentName, jsUrl, configUrl, data = {} } = widgetConfig;
    
    console.log(`[WidgetManager] 加载 Widget: surfaceId=${surfaceId}, widgetId=${widgetId}`);
    
    try {
      // 检查是否已存在
      if (this.widgets.has(surfaceId)) {
        console.warn(`[WidgetManager] Widget 已存在: ${surfaceId}`);
        return this.widgets.get(surfaceId);
      }
      
      // 加载 Widget 资源
      const loadResult = await this.loader.loadWidget({
        widgetId,
        componentName,
        jsUrl,
        configUrl
      });
      
      const { config } = loadResult;
      
      // 计算布局位置
      const { w, h } = config.layout;
      const { x, y } = this.layoutCalculator.calculateNextPosition(w, h, surfaceId);
      
      // 创建 Widget 实例
      const widget = {
        surfaceId,
        widgetId,
        componentName,
        x,
        y,
        w,
        h,
        resizable: config.resizable !== false,
        draggable: config.draggable !== false,
        data,
        config,
        status: 'loaded',
        createdAt: new Date().toISOString()
      };
      
      // 保存 Widget 实例
      this.widgets.set(surfaceId, widget);
      
      // 初始化数据模型
      this.dataModels.set(surfaceId, {});
      
      // 触发事件
      this._emitEvent('widgetAdded', widget);
      
      console.log(`[WidgetManager] Widget 加载成功: ${surfaceId}`);
      return widget;
    } catch (error) {
      console.error(`[WidgetManager] Widget 加载失败: ${surfaceId}`, error);
      
      // 触发错误事件
      this._emitEvent('widgetError', { surfaceId, error });
      
      throw error;
    }
  }

  /**
   * 批量加载 Widget
   * @param {Array} widgetConfigs - Widget 配置数组
   * @param {Function} onProgress - 进度回调 (loaded, total)
   * @returns {Promise<Array>} Widget 实例数组
   */
  async loadWidgetsBatch(widgetConfigs, onProgress = null) {
    console.log(`[WidgetManager] 批量加载 ${widgetConfigs.length} 个 Widget`);
    
    const widgets = [];
    let loaded = 0;
    
    for (const widgetConfig of widgetConfigs) {
      try {
        const widget = await this.loadWidget(widgetConfig);
        widgets.push(widget);
      } catch (error) {
        console.error(`[WidgetManager] Widget 加载失败:`, error);
        widgets.push(null);
      }
      
      loaded++;
      
      // 调用进度回调
      if (onProgress) {
        onProgress(loaded, widgetConfigs.length);
      }
    }
    
    const succeeded = widgets.filter(w => w !== null).length;
    console.log(`[WidgetManager] 批量加载完成: 成功 ${succeeded}/${widgetConfigs.length}`);
    
    return widgets;
  }

  /**
   * 更新 Widget 数据
   * @param {String} surfaceId - Surface ID
   * @param {Object} data - 新数据
   */
  updateWidgetData(surfaceId, data) {
    const widget = this.widgets.get(surfaceId);
    
    if (!widget) {
      console.warn(`[WidgetManager] Widget 不存在: ${surfaceId}`);
      return false;
    }
    
    // 更新数据
    widget.data = { ...widget.data, ...data };
    widget.updatedAt = new Date().toISOString();
    
    // 触发事件
    this._emitEvent('widgetUpdated', { surfaceId, data });
    
    console.log(`[WidgetManager] Widget 数据已更新: ${surfaceId}`);
    return true;
  }

  /**
   * 更新 Widget 数据模型（支持 JSON Pointer 路径）
   * @param {String} surfaceId - Surface ID
   * @param {String} path - 数据路径（如 "/perf/data"）
   * @param {String} op - 操作类型：replace, add, remove
   * @param {Any} value - 新值
   */
  updateDataModel(surfaceId, path, op, value) {
    const widget = this.widgets.get(surfaceId);
    
    if (!widget) {
      console.warn(`[WidgetManager] Widget 不存在: ${surfaceId}`);
      return false;
    }
    
    // 获取数据模型
    let dataModel = this.dataModels.get(surfaceId) || {};
    
    // 解析路径
    const pathParts = path.split('/').filter(p => p);
    
    // 根据操作类型更新数据
    switch (op) {
      case 'replace':
        dataModel = this._setValueByPath(dataModel, pathParts, value);
        break;
      case 'add':
        dataModel = this._addValueByPath(dataModel, pathParts, value);
        break;
      case 'remove':
        dataModel = this._removeValueByPath(dataModel, pathParts);
        break;
      default:
        console.warn(`[WidgetManager] 未知的操作类型: ${op}`);
        return false;
    }
    
    // 保存数据模型
    this.dataModels.set(surfaceId, dataModel);
    
    // 更新 Widget 数据
    widget.data = { ...widget.data, ...dataModel };
    widget.updatedAt = new Date().toISOString();
    
    // 触发事件
    this._emitEvent('widgetUpdated', { surfaceId, path, op, value });
    
    console.log(`[WidgetManager] 数据模型已更新: ${surfaceId}, path=${path}, op=${op}`);
    return true;
  }

  /**
   * 更新 Widget 位置
   * @param {String} surfaceId - Surface ID
   * @param {Number} x - X 坐标
   * @param {Number} y - Y 坐标
   * @param {Number} w - 宽度
   * @param {Number} h - 高度
   */
  updateWidgetPosition(surfaceId, x, y, w, h) {
    const widget = this.widgets.get(surfaceId);
    
    if (!widget) {
      console.warn(`[WidgetManager] Widget 不存在: ${surfaceId}`);
      return false;
    }
    
    // 更新布局计算器
    this.layoutCalculator.updatePosition(surfaceId, x, y, w, h);
    
    // 更新 Widget 实例
    widget.x = x;
    widget.y = y;
    widget.w = w;
    widget.h = h;
    widget.updatedAt = new Date().toISOString();
    
    // 触发事件
    this._emitEvent('widgetUpdated', { surfaceId, position: { x, y, w, h } });
    
    console.log(`[WidgetManager] Widget 位置已更新: ${surfaceId}`);
    return true;
  }

  /**
   * 删除 Widget
   * @param {String} surfaceId - Surface ID
   */
  removeWidget(surfaceId) {
    const widget = this.widgets.get(surfaceId);
    
    if (!widget) {
      console.warn(`[WidgetManager] Widget 不存在: ${surfaceId}`);
      return false;
    }
    
    // 释放布局位置
    this.layoutCalculator.releasePosition(surfaceId);
    
    // 删除 Widget 实例
    this.widgets.delete(surfaceId);
    this.dataModels.delete(surfaceId);
    
    // 触发事件
    this._emitEvent('widgetRemoved', { surfaceId, widget });
    
    console.log(`[WidgetManager] Widget 已删除: ${surfaceId}`);
    return true;
  }

  /**
   * 获取 Widget
   * @param {String} surfaceId - Surface ID
   * @returns {Object|null}
   */
  getWidget(surfaceId) {
    return this.widgets.get(surfaceId) || null;
  }

  /**
   * 获取所有 Widget
   * @returns {Array}
   */
  getAllWidgets() {
    return Array.from(this.widgets.values());
  }

  /**
   * 清空所有 Widget
   */
  clearAll() {
    console.log(`[WidgetManager] 清空所有 Widget`);
    
    // 删除所有 Widget
    for (const surfaceId of this.widgets.keys()) {
      this.removeWidget(surfaceId);
    }
    
    // 重置布局计算器
    this.layoutCalculator.reset();
  }

  /**
   * 监听事件
   * @param {String} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }

  /**
   * 取消监听事件
   * @param {String} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(callback);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   * @param {String} event - 事件名称
   * @param {Any} data - 事件数据
   */
  _emitEvent(event, data) {
    if (this.eventListeners[event]) {
      for (const callback of this.eventListeners[event]) {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WidgetManager] 事件回调错误:`, error);
        }
      }
    }
  }

  /**
   * 根据路径设置值
   * @param {Object} obj - 对象
   * @param {Array} pathParts - 路径部分数组
   * @param {Any} value - 值
   * @returns {Object}
   */
  _setValueByPath(obj, pathParts, value) {
    const result = { ...obj };
    let current = result;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
    return result;
  }

  /**
   * 根据路径添加值
   * @param {Object} obj - 对象
   * @param {Array} pathParts - 路径部分数组
   * @param {Any} value - 值
   * @returns {Object}
   */
  _addValueByPath(obj, pathParts, value) {
    const result = { ...obj };
    let current = result;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    const lastPart = pathParts[pathParts.length - 1];
    
    // 如果是数组，追加元素
    if (Array.isArray(current[lastPart])) {
      current[lastPart] = [...current[lastPart], value];
    } else {
      current[lastPart] = value;
    }
    
    return result;
  }

  /**
   * 根据路径删除值
   * @param {Object} obj - 对象
   * @param {Array} pathParts - 路径部分数组
   * @returns {Object}
   */
  _removeValueByPath(obj, pathParts) {
    const result = { ...obj };
    let current = result;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) {
        return result;
      }
      current = current[part];
    }
    
    delete current[pathParts[pathParts.length - 1]];
    return result;
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      widgetCount: this.widgets.size,
      layoutStats: this.layoutCalculator.getStats(),
      loaderStats: this.loader.getStats()
    };
  }
}

export default WidgetManager;
