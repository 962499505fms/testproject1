# API 接口设计文档

## 📡 接口概览

本文档定义了 A2UI Widget 系统所需的所有 API 接口，包括 HTTP REST API 和 WebSocket 消息协议。

---

## 1. HTTP REST API

### 1.1 获取 Widget 配置列表

**接口描述**：获取所有可用的 Widget 配置信息

**请求方式**：`GET`

**请求路径**：`/visualization/widgets/configs`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页数量，默认 20 |
| category | String | 否 | Widget 分类 |

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 50,
    "list": [
      {
        "widgetId": "widget-line-chart",
        "componentName": "widget-line-chart",
        "version": "1.0.0",
        "jsUrl": "https://cdn.example.com/widgets/line-chart.js",
        "configUrl": "https://cdn.example.com/widgets/line-chart-config.json",
        "category": "chart",
        "title": "折线图",
        "description": "用于展示趋势数据",
        "thumbnail": "https://cdn.example.com/thumbnails/line-chart.png"
      }
    ]
  }
}
```

---

### 1.2 获取单个 Widget 配置

**接口描述**：获取指定 Widget 的详细配置

**请求方式**：`GET`

**请求路径**：`/visualization/widgets/config/:widgetId`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| widgetId | String | 是 | Widget ID |

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "widgetId": "widget-line-chart",
    "componentName": "widget-line-chart",
    "version": "1.0.0",
    "layout": {
      "w": 6,
      "h": 7,
      "minW": 4,
      "minH": 5,
      "maxW": 12,
      "maxH": 20
    },
    "resizable": true,
    "draggable": true,
    "title": "折线图",
    "description": "用于展示趋势数据的折线图组件",
    "props": {
      "title": {
        "type": "String",
        "default": ""
      },
      "data": {
        "type": "Array",
        "required": true
      },
      "xAxisName": {
        "type": "String",
        "default": "X轴"
      },
      "yAxisName": {
        "type": "String",
        "default": "Y轴"
      }
    }
  }
}
```

---

### 1.3 获取历史 Widget 数据

**接口描述**：获取用户已创建的历史 Widget 数据

**请求方式**：`GET`

**请求路径**：`/visualization/widgets/history`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | String | 否 | 用户 ID |
| canvasId | String | 否 | 画布 ID |
| startTime | String | 否 | 开始时间 (ISO 8601) |
| endTime | String | 否 | 结束时间 (ISO 8601) |

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "surfaceId": "history-widget-001",
      "widgetId": "widget-line-chart",
      "componentName": "widget-line-chart",
      "jsUrl": "https://cdn.example.com/widgets/line-chart.js",
      "configUrl": "https://cdn.example.com/widgets/line-chart-config.json",
      "layout": {
        "w": 6,
        "h": 7
      },
      "data": {
        "title": "CPU 使用率",
        "xAxisName": "时间",
        "yAxisName": "使用率(%)",
        "categories": ["00:00", "01:00", "02:00", "03:00"],
        "series": [
          {
            "name": "CPU",
            "data": [45.2, 52.8, 48.3, 61.5]
          }
        ]
      },
      "createdAt": "2026-01-18T06:00:00Z",
      "updatedAt": "2026-01-18T06:30:00Z"
    }
  ]
}
```

---

### 1.4 保存 Widget 配置

**接口描述**：保存用户的 Widget 配置（用于持久化）

**请求方式**：`POST`

**请求路径**：`/visualization/widgets/save`

**请求体**：

```json
{
  "surfaceId": "widget-001",
  "widgetId": "widget-line-chart",
  "layout": {
    "x": 0,
    "y": 0,
    "w": 6,
    "h": 7
  },
  "data": {
    "title": "CPU 使用率",
    "categories": ["00:00", "01:00"],
    "series": [{ "name": "CPU", "data": [45, 52] }]
  }
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "保存成功",
  "data": {
    "surfaceId": "widget-001",
    "savedAt": "2026-01-18T06:42:00Z"
  }
}
```

---

### 1.5 删除 Widget

**接口描述**：删除指定的 Widget

**请求方式**：`DELETE`

**请求路径**：`/visualization/widgets/:surfaceId`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| surfaceId | String | 是 | Surface ID |

**响应示例**：

```json
{
  "code": 200,
  "message": "删除成功",
  "data": {
    "surfaceId": "widget-001",
    "deletedAt": "2026-01-18T06:42:00Z"
  }
}
```

---

## 2. WebSocket 消息协议

### 2.1 连接配置

**WebSocket URL**：`ws://192.167.26.248:30000/ws/canvas`

**连接参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | String | 是 | 用户 ID |
| canvasId | String | 是 | 画布 ID |
| token | String | 是 | 认证 Token |

**连接示例**：

```javascript
const ws = new WebSocket('ws://192.167.26.248:30000/ws/canvas?userId=user123&canvasId=canvas456&token=xxx');
```

---

### 2.2 A2UI 协议消息格式

#### 2.2.1 createSurface (创建 Surface)

**消息类型**：`createSurface`

**消息格式**：

```json
{
  "type": "createSurface",
  "surfaceId": "widget-001",
  "catalogId": "https://www.h3c.com/ai-canvas/spec/a2ui/0.9/catalog_definition.json",
  "widgetConfig": {
    "widgetId": "widget-line-chart",
    "componentName": "widget-line-chart",
    "jsUrl": "https://cdn.example.com/widgets/line-chart.js",
    "configUrl": "https://cdn.example.com/widgets/line-chart-config.json"
  },
  "timestamp": "2026-01-18T06:42:00Z"
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 是 | 消息类型，固定为 "createSurface" |
| surfaceId | String | 是 | Surface 唯一标识 |
| catalogId | String | 是 | A2UI 目录定义 URL |
| widgetConfig | Object | 是 | Widget 配置信息 |
| widgetConfig.widgetId | String | 是 | Widget ID |
| widgetConfig.componentName | String | 是 | Vue 组件名称 |
| widgetConfig.jsUrl | String | 是 | Widget JS 文件 URL |
| widgetConfig.configUrl | String | 是 | Widget 配置文件 URL |
| timestamp | String | 是 | 消息时间戳 (ISO 8601) |

---

#### 2.2.2 updateComponents (更新组件)

**消息类型**：`updateComponents`

**消息格式**：

```json
{
  "type": "updateComponents",
  "surfaceId": "widget-001",
  "components": [
    {
      "id": "root",
      "component": "widget-line-chart",
      "title": "CPU 使用率",
      "xAxisName": "时间",
      "yAxisName": {
        "path": "/perf/yAxisName"
      },
      "data": {
        "path": "/perf/data"
      }
    }
  ],
  "timestamp": "2026-01-18T06:42:00Z"
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 是 | 消息类型，固定为 "updateComponents" |
| surfaceId | String | 是 | Surface 唯一标识 |
| components | Array | 是 | 组件配置数组 |
| components[].id | String | 是 | 组件 ID |
| components[].component | String | 是 | 组件名称 |
| components[].* | Any | 否 | 组件属性（支持直接值或 path 引用） |
| timestamp | String | 是 | 消息时间戳 |

**属性值类型**：

- **直接值**：`"title": "CPU 使用率"`
- **路径引用**：`"data": { "path": "/perf/data" }`（从 dataModel 中获取）

---

#### 2.2.3 updateDataModel (更新数据模型)

**消息类型**：`updateDataModel`

**消息格式**：

```json
{
  "type": "updateDataModel",
  "surfaceId": "widget-001",
  "path": "/perf",
  "op": "replace",
  "value": {
    "yAxisName": "CPU使用率(%)",
    "data": [
      { "xAxis": "2026-01-18 14:00:00", "yAxis": 45.2 },
      { "xAxis": "2026-01-18 14:01:00", "yAxis": 52.8 },
      { "xAxis": "2026-01-18 14:02:00", "yAxis": 48.3 }
    ]
  },
  "timestamp": "2026-01-18T06:42:00Z"
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 是 | 消息类型，固定为 "updateDataModel" |
| surfaceId | String | 是 | Surface 唯一标识 |
| path | String | 是 | 数据路径 (JSON Pointer 格式) |
| op | String | 是 | 操作类型：replace, add, remove |
| value | Any | 是 | 更新的值 |
| timestamp | String | 是 | 消息时间戳 |

**操作类型说明**：

- **replace**：替换指定路径的值
- **add**：在指定路径添加值（数组追加或对象添加属性）
- **remove**：删除指定路径的值

---

#### 2.2.4 deleteSurface (删除 Surface)

**消息类型**：`deleteSurface`

**消息格式**：

```json
{
  "type": "deleteSurface",
  "surfaceId": "widget-001",
  "timestamp": "2026-01-18T06:42:00Z"
}
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 是 | 消息类型，固定为 "deleteSurface" |
| surfaceId | String | 是 | Surface 唯一标识 |
| timestamp | String | 是 | 消息时间戳 |

---

### 2.3 客户端响应消息

#### 2.3.1 操作成功响应

```json
{
  "type": "ack",
  "messageId": "msg-001",
  "status": "success",
  "surfaceId": "widget-001",
  "timestamp": "2026-01-18T06:42:00Z"
}
```

#### 2.3.2 操作失败响应

```json
{
  "type": "ack",
  "messageId": "msg-001",
  "status": "error",
  "surfaceId": "widget-001",
  "error": {
    "code": "LOAD_FAILED",
    "message": "Widget JS 文件加载失败",
    "details": "Network timeout"
  },
  "timestamp": "2026-01-18T06:42:00Z"
}
```

---

## 3. Widget JS 文件规范

### 3.1 文件结构

Widget JS 文件应该是一个自执行的 UMD 模块，导出 Vue 组件定义。

**示例**：

```javascript
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    // CommonJS
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(factory);
  } else {
    // Browser globals
    global['widget-line-chart'] = factory();
  }
}(this, function () {
  'use strict';

  return {
    name: 'widget-line-chart',
    props: {
      surfaceId: {
        type: [String, Number],
        required: true
      },
      data: {
        type: String,  // JSON 字符串
        required: true
      },
      lang: {
        type: String,
        default: 'zh-CN'
      },
      theme: {
        type: String,
        default: 'light'
      },
      resize: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        chartInstance: null
      };
    },
    computed: {
      parsedData() {
        try {
          return JSON.parse(this.data);
        } catch (e) {
          return {};
        }
      }
    },
    mounted() {
      this.initChart();
    },
    methods: {
      initChart() {
        // 初始化图表逻辑
      },
      updateChart() {
        // 更新图表逻辑
      }
    },
    watch: {
      data: {
        handler() {
          this.updateChart();
        },
        deep: true
      },
      resize() {
        this.$nextTick(() => {
          this.chartInstance && this.chartInstance.resize();
        });
      }
    },
    beforeDestroy() {
      // 清理资源
      this.chartInstance && this.chartInstance.dispose();
    },
    template: `
      <div class="widget-line-chart">
        <div ref="chart" style="width: 100%; height: 100%;"></div>
      </div>
    `
  };
}));
```

### 3.2 必需的 Props

所有 Widget 组件必须接收以下 props：

| Prop 名 | 类型 | 必填 | 说明 |
|---------|------|------|------|
| surfaceId | String/Number | 是 | Surface 唯一标识 |
| data | String | 是 | Widget 数据 (JSON 字符串) |
| lang | String | 否 | 语言设置 |
| theme | String | 否 | 主题设置 |
| resize | Boolean | 否 | 触发 resize 事件 |

### 3.3 生命周期要求

- **mounted**：初始化 Widget
- **beforeDestroy**：清理资源（事件监听、定时器、图表实例等）
- **watch data**：监听数据变化并更新视图
- **watch resize**：监听 resize 变化并调整尺寸

---

## 4. Widget 配置文件规范

### 4.1 配置文件格式

```json
{
  "widgetId": "widget-line-chart",
  "componentName": "widget-line-chart",
  "version": "1.0.0",
  "layout": {
    "w": 6,
    "h": 7,
    "minW": 4,
    "minH": 5,
    "maxW": 12,
    "maxH": 20
  },
  "resizable": true,
  "draggable": true,
  "title": "折线图",
  "description": "用于展示趋势数据的折线图组件",
  "category": "chart",
  "tags": ["图表", "趋势", "折线"],
  "author": "Widget Team",
  "props": {
    "title": {
      "type": "String",
      "default": "",
      "description": "图表标题"
    },
    "data": {
      "type": "Array",
      "required": true,
      "description": "图表数据"
    },
    "xAxisName": {
      "type": "String",
      "default": "X轴",
      "description": "X轴名称"
    },
    "yAxisName": {
      "type": "String",
      "default": "Y轴",
      "description": "Y轴名称"
    }
  },
  "events": {
    "refreshWidget": {
      "description": "刷新 Widget 事件"
    }
  }
}
```

### 4.2 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| widgetId | String | 是 | Widget 唯一标识 |
| componentName | String | 是 | Vue 组件名称 |
| version | String | 是 | 版本号 (语义化版本) |
| layout | Object | 是 | 布局配置 |
| layout.w | Number | 是 | 默认宽度（网格列数） |
| layout.h | Number | 是 | 默认高度（网格行数） |
| layout.minW | Number | 否 | 最小宽度 |
| layout.minH | Number | 否 | 最小高度 |
| layout.maxW | Number | 否 | 最大宽度 |
| layout.maxH | Number | 否 | 最大高度 |
| resizable | Boolean | 否 | 是否可调整大小 |
| draggable | Boolean | 否 | 是否可拖拽 |
| title | String | 是 | Widget 标题 |
| description | String | 否 | Widget 描述 |
| category | String | 否 | Widget 分类 |
| tags | Array | 否 | Widget 标签 |
| author | String | 否 | 作者 |
| props | Object | 否 | Props 定义 |
| events | Object | 否 | 事件定义 |

---

## 5. 错误码定义

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| LOAD_JS_FAILED | JS 文件加载失败 | 检查 URL 是否正确，网络是否正常 |
| LOAD_CONFIG_FAILED | 配置文件加载失败 | 检查配置文件 URL |
| INVALID_CONFIG | 配置文件格式错误 | 检查 JSON 格式 |
| COMPONENT_REGISTER_FAILED | 组件注册失败 | 检查组件名称是否冲突 |
| LAYOUT_CALCULATE_FAILED | 布局计算失败 | 检查 w、h 参数 |
| RENDER_FAILED | 渲染失败 | 检查组件定义和数据格式 |
| INVALID_MESSAGE | 无效的 A2UI 消息 | 检查消息格式 |
| SURFACE_NOT_FOUND | Surface 不存在 | 检查 surfaceId |
| NETWORK_ERROR | 网络错误 | 检查网络连接 |
| TIMEOUT | 请求超时 | 增加超时时间或重试 |

---

## 6. 接口调用示例

### 6.1 获取历史数据并渲染

```javascript
import axios from 'axios';
import WidgetManager from './core/WidgetManager';

const widgetManager = new WidgetManager();

// 1. 获取历史数据
async function loadHistoryWidgets() {
  try {
    const response = await axios.get('/visualization/widgets/history', {
      params: {
        canvasId: 'canvas-001'
      }
    });
    
    const historyData = response.data.data;
    
    // 2. 批量加载 Widget
    await widgetManager.loadWidgetsBatch(historyData);
    
    console.log('历史数据加载完成');
  } catch (error) {
    console.error('加载历史数据失败:', error);
  }
}
```

### 6.2 监听 WebSocket 推送

```javascript
import WebSocketService from '@/service/websoket-service';
import A2UIProtocolHandler from './core/A2UIProtocolHandler';

const protocolHandler = new A2UIProtocolHandler(widgetManager);

// 连接 WebSocket
WebSocketService.connect('ws://192.167.26.248:30000/ws/canvas')
  .then(() => {
    console.log('WebSocket 连接成功');
    
    // 订阅消息
    WebSocketService.subscribe('/topic/canvas/canvas-001', (message) => {
      // 处理 A2UI 消息
      switch (message.type) {
        case 'createSurface':
          protocolHandler.handleCreateSurface(message);
          break;
        case 'updateComponents':
          protocolHandler.handleUpdateComponents(message);
          break;
        case 'updateDataModel':
          protocolHandler.handleUpdateDataModel(message);
          break;
        case 'deleteSurface':
          protocolHandler.handleDeleteSurface(message);
          break;
        default:
          console.warn('未知的消息类型:', message.type);
      }
    });
  })
  .catch((error) => {
    console.error('WebSocket 连接失败:', error);
  });
```

---

## 7. 测试接口

为了方便开发和测试，提供以下 Mock 接口：

### 7.1 Mock 历史数据

**请求路径**：`/mock/widgets/history`

**响应**：返回模拟的历史 Widget 数据

### 7.2 Mock Widget 配置

**请求路径**：`/mock/widgets/config/:widgetId`

**响应**：返回模拟的 Widget 配置

### 7.3 Mock WebSocket 推送

在开发环境下，可以使用定时器模拟 WebSocket 推送：

```javascript
// 模拟推送消息
setInterval(() => {
  const mockMessage = {
    type: 'updateDataModel',
    surfaceId: 'widget-001',
    path: '/perf/data',
    op: 'add',
    value: {
      xAxis: new Date().toISOString(),
      yAxis: Math.random() * 100
    },
    timestamp: new Date().toISOString()
  };
  
  // 触发消息处理
  protocolHandler.handleUpdateDataModel(mockMessage);
}, 5000);
```

---

## 总结

本 API 设计文档定义了：

1. **HTTP REST API**：用于获取配置、历史数据、保存和删除 Widget
2. **WebSocket 协议**：用于实时推送 A2UI 消息
3. **Widget 规范**：定义了 Widget JS 文件和配置文件的格式
4. **错误码**：统一的错误码定义
5. **调用示例**：实际的代码示例

这些接口设计确保了前后端的清晰对接，为系统的实现提供了明确的规范。
