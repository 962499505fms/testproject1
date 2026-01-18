# A2UI Widget 系统使用文档

## 📚 快速开始

### 1. 引入核心模块

```javascript
import WidgetManager from '@/views/aiCanvas/canvas/core/WidgetManager';
import A2UIProtocolHandler from '@/views/aiCanvas/canvas/core/A2UIProtocolHandler';
import HistoryDataHandler from '@/views/aiCanvas/canvas/core/HistoryDataHandler';
```

### 2. 初始化系统

```javascript
export default {
  data() {
    return {
      widgetManager: null,
      protocolHandler: null,
      historyHandler: null,
      widgets: []
    };
  },
  
  created() {
    // 初始化 Widget Manager
    this.widgetManager = new WidgetManager({
      colNum: 12,  // 网格列数
      margin: 8    // 间距
    });
    
    // 初始化协议处理器
    this.protocolHandler = new A2UIProtocolHandler(this.widgetManager);
    
    // 初始化历史数据处理器
    this.historyHandler = new HistoryDataHandler(this.widgetManager);
    
    // 监听 Widget 事件
    this.widgetManager.on('widgetAdded', this.onWidgetAdded);
    this.widgetManager.on('widgetUpdated', this.onWidgetUpdated);
    this.widgetManager.on('widgetRemoved', this.onWidgetRemoved);
  }
};
```

### 3. 加载历史数据

```javascript
async loadHistoryWidgets() {
  const historyData = [
    {
      surfaceId: 'widget-001',
      widgetId: 'widget-line-chart',
      componentName: 'widget-line-chart',
      jsUrl: 'https://cdn.example.com/widgets/line-chart.js',
      configUrl: 'https://cdn.example.com/widgets/line-chart-config.json',
      data: {
        title: 'CPU 使用率',
        categories: ['00:00', '01:00', '02:00'],
        series: [{ name: 'CPU', data: [45, 52, 48] }]
      }
    }
    // ... 更多 Widget
  ];
  
  try {
    const result = await this.historyHandler.loadHistoryData(
      historyData,
      (loaded, total, percentage) => {
        console.log(`加载进度: ${percentage}%`);
        // 更新进度条
        this.loadingPercentage = percentage;
      }
    );
    
    // 更新 widgets 列表
    this.widgets = this.widgetManager.getAllWidgets();
    
    console.log(`历史数据加载完成: ${result.succeeded}/${result.total}`);
  } catch (error) {
    console.error('加载历史数据失败:', error);
  }
}
```

### 4. 处理 WebSocket 推送

```javascript
import WebSocketService from '@/service/websoket-service';

mounted() {
  // 连接 WebSocket
  WebSocketService.connect('ws://192.167.26.248:30000/ws/canvas')
    .then(() => {
      console.log('WebSocket 连接成功');
      
      // 订阅消息
      WebSocketService.subscribe('/topic/canvas/canvas-001', (message) => {
        this.handleA2UIMessage(message);
      });
    })
    .catch((error) => {
      console.error('WebSocket 连接失败:', error);
    });
},

async handleA2UIMessage(message) {
  try {
    const result = await this.protocolHandler.handleMessage(message);
    
    if (result.success) {
      // 更新 widgets 列表
      this.widgets = this.widgetManager.getAllWidgets();
    } else {
      console.error('消息处理失败:', result.error);
    }
  } catch (error) {
    console.error('处理 A2UI 消息失败:', error);
  }
}
```

---

## 📋 测试数据

### 测试用 Widget 配置

```javascript
// 测试数据：历史 Widget
export const mockHistoryWidgets = [
  {
    surfaceId: 'history-widget-001',
    widgetId: 'widget-line-chart',
    componentName: 'widget-line-chart',
    jsUrl: '/mock/widgets/line-chart.js',
    configUrl: '/mock/widgets/line-chart-config.json',
    data: {
      title: 'CPU 使用率',
      xAxisName: '时间',
      yAxisName: '使用率(%)',
      categories: ['00:00', '01:00', '02:00', '03:00', '04:00'],
      series: [
        {
          name: 'CPU',
          data: [45.2, 52.8, 48.3, 61.5, 55.7]
        }
      ]
    }
  },
  {
    surfaceId: 'history-widget-002',
    widgetId: 'widget-pie-chart',
    componentName: 'widget-pie-chart',
    jsUrl: '/mock/widgets/pie-chart.js',
    configUrl: '/mock/widgets/pie-chart-config.json',
    data: {
      title: '内存分布',
      xData: ['已使用', '缓存', '空闲'],
      yData: [
        { name: '已使用', value: 4096 },
        { name: '缓存', value: 2048 },
        { name: '空闲', value: 1024 }
      ]
    }
  },
  {
    surfaceId: 'history-widget-003',
    widgetId: 'widget-bar-chart',
    componentName: 'widget-bar-chart',
    jsUrl: '/mock/widgets/bar-chart.js',
    configUrl: '/mock/widgets/bar-chart-config.json',
    data: {
      title: '网络流量',
      categories: ['入站', '出站'],
      series: [
        { name: '流量(MB)', data: [1024, 2048] }
      ]
    }
  }
];

// 测试数据：A2UI 消息
export const mockA2UIMessages = {
  // 创建 Surface
  createSurface: {
    type: 'createSurface',
    surfaceId: 'realtime-widget-001',
    catalogId: 'https://www.h3c.com/ai-canvas/spec/a2ui/0.9/catalog_definition.json',
    widgetConfig: {
      widgetId: 'widget-line-chart',
      componentName: 'widget-line-chart',
      jsUrl: '/mock/widgets/line-chart.js',
      configUrl: '/mock/widgets/line-chart-config.json'
    },
    timestamp: new Date().toISOString()
  },
  
  // 更新组件
  updateComponents: {
    type: 'updateComponents',
    surfaceId: 'history-widget-001',
    components: [
      {
        id: 'root',
        component: 'widget-line-chart',
        title: 'CPU 使用率（更新）',
        xAxisName: '时间',
        yAxisName: { path: '/perf/yAxisName' },
        data: { path: '/perf/data' }
      }
    ],
    timestamp: new Date().toISOString()
  },
  
  // 更新数据模型
  updateDataModel: {
    type: 'updateDataModel',
    surfaceId: 'history-widget-001',
    path: '/perf',
    op: 'replace',
    value: {
      yAxisName: 'CPU使用率(%)',
      data: [
        { xAxis: '05:00', yAxis: 58.3 },
        { xAxis: '06:00', yAxis: 62.1 }
      ]
    },
    timestamp: new Date().toISOString()
  },
  
  // 删除 Surface
  deleteSurface: {
    type: 'deleteSurface',
    surfaceId: 'history-widget-001',
    timestamp: new Date().toISOString()
  }
};

// 测试数据：Widget 配置文件
export const mockWidgetConfig = {
  widgetId: 'widget-line-chart',
  componentName: 'widget-line-chart',
  version: '1.0.0',
  layout: {
    w: 6,
    h: 7,
    minW: 4,
    minH: 5,
    maxW: 12,
    maxH: 20
  },
  resizable: true,
  draggable: true,
  title: '折线图',
  description: '用于展示趋势数据的折线图组件',
  category: 'chart',
  tags: ['图表', '趋势', '折线'],
  author: 'Widget Team',
  props: {
    title: {
      type: 'String',
      default: '',
      description: '图表标题'
    },
    data: {
      type: 'Array',
      required: true,
      description: '图表数据'
    },
    xAxisName: {
      type: 'String',
      default: 'X轴',
      description: 'X轴名称'
    },
    yAxisName: {
      type: 'String',
      default: 'Y轴',
      description: 'Y轴名称'
    }
  }
};
```

---

## 🎯 API 参考

### WidgetManager

#### 方法

- **`loadWidget(widgetConfig)`** - 加载单个 Widget
- **`loadWidgetsBatch(widgetConfigs, onProgress)`** - 批量加载 Widget
- **`updateWidgetData(surfaceId, data)`** - 更新 Widget 数据
- **`updateDataModel(surfaceId, path, op, value)`** - 更新数据模型
- **`updateWidgetPosition(surfaceId, x, y, w, h)`** - 更新 Widget 位置
- **`removeWidget(surfaceId)`** - 删除 Widget
- **`getWidget(surfaceId)`** - 获取 Widget
- **`getAllWidgets()`** - 获取所有 Widget
- **`clearAll()`** - 清空所有 Widget
- **`on(event, callback)`** - 监听事件
- **`off(event, callback)`** - 取消监听事件

#### 事件

- **`widgetAdded`** - Widget 添加事件
- **`widgetUpdated`** - Widget 更新事件
- **`widgetRemoved`** - Widget 删除事件
- **`widgetError`** - Widget 错误事件

### A2UIProtocolHandler

#### 方法

- **`handleMessage(message)`** - 处理 A2UI 消息
- **`handleCreateSurface(message)`** - 处理 createSurface 消息
- **`handleUpdateComponents(message)`** - 处理 updateComponents 消息
- **`handleUpdateDataModel(message)`** - 处理 updateDataModel 消息
- **`handleDeleteSurface(message)`** - 处理 deleteSurface 消息
- **`validateMessage(message)`** - 验证消息格式
- **`handleMessages(messages)`** - 批量处理消息

### HistoryDataHandler

#### 方法

- **`loadHistoryData(historyData, onProgress, options)`** - 加载历史数据
- **`renderInBatches(data, batchSize, batchDelay, onBatchComplete)`** - 分批渲染
- **`preloadHistoryData(historyData)`** - 预加载历史数据
- **`loadIncremental(widgetConfig, withAnimation)`** - 增量加载
- **`getStats()`** - 获取统计信息

---

## 💡 最佳实践

### 1. 性能优化

```javascript
// 使用分批加载，避免一次性加载过多 Widget
await this.historyHandler.loadHistoryData(historyData, onProgress, {
  batchSize: 5,      // 每批 5 个
  batchDelay: 100    // 批次间延迟 100ms
});

// 预加载常用 Widget
await this.widgetManager.loader.preload([
  { widgetId: 'widget-line-chart', jsUrl: '...', configUrl: '...' }
]);
```

### 2. 错误处理

```javascript
try {
  await this.widgetManager.loadWidget(widgetConfig);
} catch (error) {
  // 显示友好的错误提示
  this.$message.error(`Widget 加载失败: ${error.message}`);
  
  // 记录错误日志
  console.error('Widget 加载失败:', error);
}
```

### 3. 内存管理

```javascript
beforeDestroy() {
  // 清空所有 Widget
  this.widgetManager.clearAll();
  
  // 取消事件监听
  this.widgetManager.off('widgetAdded', this.onWidgetAdded);
  this.widgetManager.off('widgetUpdated', this.onWidgetUpdated);
  this.widgetManager.off('widgetRemoved', this.onWidgetRemoved);
  
  // 断开 WebSocket 连接
  WebSocketService.disconnect();
}
```

### 4. 调试技巧

```javascript
// 打印布局矩阵
this.widgetManager.layoutCalculator.printMatrix(20);

// 获取统计信息
const stats = this.widgetManager.getStats();
console.log('Widget 统计:', stats);

// 获取加载器统计
const loaderStats = this.widgetManager.loader.getStats();
console.log('加载器统计:', loaderStats);
```

---

## 🔧 故障排查

### 问题 1：Widget 加载失败

**可能原因：**
- JS 文件 URL 不正确
- 配置文件格式错误
- 网络问题

**解决方法：**
```javascript
// 检查 URL 是否可访问
console.log('JS URL:', widgetConfig.jsUrl);
console.log('Config URL:', widgetConfig.configUrl);

// 检查配置文件格式
const config = await configLoader.loadConfig(widgetConfig.configUrl);
console.log('配置文件:', config);
```

### 问题 2：Widget 位置重叠

**可能原因：**
- 布局计算器未正确初始化
- 手动设置了 x, y 坐标

**解决方法：**
```javascript
// 重置布局计算器
this.widgetManager.layoutCalculator.reset();

// 重新计算所有 Widget 位置
const widgets = this.widgetManager.getAllWidgets();
for (const widget of widgets) {
  const { w, h } = widget;
  const { x, y } = this.widgetManager.layoutCalculator.calculateNextPosition(w, h, widget.surfaceId);
  this.widgetManager.updateWidgetPosition(widget.surfaceId, x, y, w, h);
}
```

### 问题 3：WebSocket 消息处理失败

**可能原因：**
- 消息格式不符合 A2UI 规范
- surfaceId 不存在

**解决方法：**
```javascript
// 验证消息格式
try {
  this.protocolHandler.validateMessage(message);
  console.log('消息格式正确');
} catch (error) {
  console.error('消息格式错误:', error.message);
}

// 检查 Widget 是否存在
const widget = this.widgetManager.getWidget(message.surfaceId);
if (!widget) {
  console.error('Widget 不存在:', message.surfaceId);
}
```

---

## 📞 技术支持

如有问题，请查阅：
- [设计文档](../plans/a2ui-widget-integration-design.md)
- [架构图](../plans/architecture-diagrams.md)
- [API 设计](../plans/api-design.md)

或联系开发团队。
