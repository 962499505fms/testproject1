/**
 * A2UI Protocol Handler - A2UI 协议处理器
 * 
 * 功能：
 * 1. 处理 A2UI 0.9 协议消息
 * 2. 支持 createSurface、updateComponents、updateDataModel、deleteSurface
 * 3. 验证消息格式
 * 4. 协调 WidgetManager 执行操作
 */

class A2UIProtocolHandler {
  constructor(widgetManager) {
    this.widgetManager = widgetManager;
    
    // A2UI 目录定义 URL
    this.catalogUrl = 'https://www.h3c.com/ai-canvas/spec/a2ui/0.9/catalog_definition.json';
    
    // 消息处理器映射
    this.messageHandlers = {
      createSurface: this.handleCreateSurface.bind(this),
      updateComponents: this.handleUpdateComponents.bind(this),
      updateDataModel: this.handleUpdateDataModel.bind(this),
      deleteSurface: this.handleDeleteSurface.bind(this)
    };
    
    console.log(`[A2UIProtocolHandler] 初始化完成`);
  }

  /**
   * 处理 A2UI 消息
   * @param {Object} message - A2UI 消息
   * @returns {Promise<Object>} 处理结果
   */
  async handleMessage(message) {
    console.log(`[A2UIProtocolHandler] 收到消息:`, message);
    
    try {
      // 验证消息格式
      this.validateMessage(message);
      
      // 获取消息类型
      const { type } = message;
      
      // 获取对应的处理器
      const handler = this.messageHandlers[type];
      
      if (!handler) {
        throw new Error(`未知的消息类型: ${type}`);
      }
      
      // 执行处理器
      const result = await handler(message);
      
      console.log(`[A2UIProtocolHandler] 消息处理成功: type=${type}`);
      
      return {
        success: true,
        type,
        result
      };
    } catch (error) {
      console.error(`[A2UIProtocolHandler] 消息处理失败:`, error);
      
      return {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * 处理 createSurface 消息
   * @param {Object} message - 消息对象
   * @returns {Promise<Object>}
   */
  async handleCreateSurface(message) {
    const { surfaceId, widgetConfig } = message;
    
    console.log(`[A2UIProtocolHandler] 创建 Surface: ${surfaceId}`);
    
    // 构建 Widget 配置
    const config = {
      surfaceId,
      widgetId: widgetConfig.widgetId,
      componentName: widgetConfig.componentName,
      jsUrl: widgetConfig.jsUrl,
      configUrl: widgetConfig.configUrl,
      data: widgetConfig.data || 
    };
    
    // 加载 Widget
    const widget = await this.widgetManager.loadWidget(config);
    
    return {
      surfaceId,
      widget
    };
  }

  /**
   * 处理 updateComponents 消息
   * @param {Object} message - 消息对象
   * @returns {Object}
   */
  handleUpdateComponents(message) {
    const { surfaceId, components } = message;
    
    console.log(`[A2UIProtocolHandler] 更新组件: ${surfaceId}`);
    
    // 获取 Widget
    const widget = this.widgetManager.getWidget(surfaceId);
    
    if (!widget) {
      throw new Error(`Surface 不存在: ${surfaceId}`);
    }
    
    // 处理组件配置
    const componentData = {};
    
    for (const component of components) {
      // 遍历组件属性
      for (const [key, value] of Object.entries(component)) {
        if (key === 'id' || key === 'component') {
          continue;
        }
        
        // 检查是否是路径引用
        if (value && typeof value === 'object' && value.path) {
          // 从数据模型中获取值
          const dataModel = this.widgetManager.dataModels.get(surfaceId) || {};
          const actualValue = this._getValueByPath(dataModel, value.path);
          componentData[key] = actualValue;
        } else {
          // 直接值
          componentData[key] = value;
        }
      }
    }
    
    // 更新 Widget 数据
    this.widgetManager.updateWidgetData(surfaceId, componentData);
    
    return {
      surfaceId,
      updated: true
    };
  }

  /**
   * 处理 updateDataModel 消息
   * @param {Object} message - 消息对象
   * @returns {Object}
   */
  handleUpdateDataModel(message) {
    const { surfaceId, path, op, value } = message;
    
    console.log(`[A2UIProtocolHandler] 更新数据模型: ${surfaceId}, path=${path}, op=${op}`);
    
    // 更新数据模型
    const success = this.widgetManager.updateDataModel(surfaceId, path, op, value);
    
    if (!success) {
      throw new Error(`更新数据模型失败: ${surfaceId}`);
    }
    
    return {
      surfaceId,
      path,
      op,
      updated: true
    };
  }

  /**
   * 处理 deleteSurface 消息
   * @param {Object} message - 消息对象
   * @returns {Object}
   */
  handleDeleteSurface(message) {
    const { surfaceId } = message;
    
    console.log(`[A2UIProtocolHandler] 删除 Surface: ${surfaceId}`);
    
    // 删除 Widget
    const success = this.widgetManager.removeWidget(surfaceId);
    
    if (!success) {
      throw new Error(`删除 Surface 失败: ${surfaceId}`);
    }
    
    return {
      surfaceId,
      deleted: true
    };
  }

  /**
   * 验证消息格式
   * @param {Object} message - 消息对象
   * @throws {Error} 如果消息格式无效
   */
  validateMessage(message) {
    // 检查必需字段
    if (!message || typeof message !== 'object') {
      throw new Error('消息格式无效');
    }
    
    if (!message.type) {
      throw new Error('消息缺少 type 字段');
    }
    
    // 根据消息类型验证
    switch (message.type) {
      case 'createSurface':
        this._validateCreateSurface(message);
        break;
      case 'updateComponents':
        this._validateUpdateComponents(message);
        break;
      case 'updateDataModel':
        this._validateUpdateDataModel(message);
        break;
      case 'deleteSurface':
        this._validateDeleteSurface(message);
        break;
      default:
        throw new Error(`未知的消息类型: ${message.type}`);
    }
  }

  /**
   * 验证 createSurface 消息
   * @param {Object} message - 消息对象
   */
  _validateCreateSurface(message) {
    if (!message.surfaceId) {
      throw new Error('createSurface 消息缺少 surfaceId');
    }
    
    if (!message.widgetConfig) {
      throw new Error('createSurface 消息缺少 widgetConfig');
    }
    
    const { widgetConfig } = message;
    
    if (!widgetConfig.widgetId) {
      throw new Error('widgetConfig 缺少 widgetId');
    }
    
    if (!widgetConfig.componentName) {
      throw new Error('widgetConfig 缺少 componentName');
    }
    
    if (!widgetConfig.jsUrl) {
      throw new Error('widgetConfig 缺少 jsUrl');
    }
    
    if (!widgetConfig.configUrl) {
      throw new Error('widgetConfig 缺少 configUrl');
    }
  }

  /**
   * 验证 updateComponents 消息
   * @param {Object} message - 消息对象
   */
  _validateUpdateComponents(message) {
    if (!message.surfaceId) {
      throw new Error('updateComponents 消息缺少 surfaceId');
    }
    
    if (!message.components || !Array.isArray(message.components)) {
      throw new Error('updateComponents 消息缺少 components 数组');
    }
  }

  /**
   * 验证 updateDataModel 消息
   * @param {Object} message - 消息对象
   */
  _validateUpdateDataModel(message) {
    if (!message.surfaceId) {
      throw new Error('updateDataModel 消息缺少 surfaceId');
    }
    
    if (!message.path) {
      throw new Error('updateDataModel 消息缺少 path');
    }
    
    if (!message.op) {
      throw new Error('updateDataModel 消息缺少 op');
    }
    
    if (!['replace', 'add', 'remove'].includes(message.op)) {
      throw new Error(`无效的操作类型: ${message.op}`);
    }
    
    if (message.op !== 'remove' && message.value === undefined) {
      throw new Error('updateDataModel 消息缺少 value');
    }
  }

  /**
   * 验证 deleteSurface 消息
   * @param {Object} message - 消息对象
   */
  _validateDeleteSurface(message) {
    if (!message.surfaceId) {
      throw new Error('deleteSurface 消息缺少 surfaceId');
    }
  }

  /**
   * 根据路径获取值
   * @param {Object} obj - 对象
   * @param {String} path - 路径（如 "/perf/data"）
   * @returns {Any}
   */
  _getValueByPath(obj, path) {
    const pathParts = path.split('/').filter(p => p);
    let current = obj;
    
    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * 批量处理消息
   * @param {Array} messages - 消息数组
   * @returns {Promise<Array>} 处理结果数组
   */
  async handleMessages(messages) {
    console.log(`[A2UIProtocolHandler] 批量处理 ${messages.length} 条消息`);
    
    const results = [];
    
    for (const message of messages) {
      const result = await this.handleMessage(message);
      results.push(result);
    }
    
    const succeeded = results.filter(r => r.success).length;
    console.log(`[A2UIProtocolHandler] 批量处理完成: 成功 ${succeeded}/${messages.length}`);
    
    return results;
  }
}

export default A2UIProtocolHandler;
