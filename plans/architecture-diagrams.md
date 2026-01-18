# A2UI Widget 系统架构图

## 1. 系统整体架构

```mermaid
graph LR
    subgraph 用户界面层
        A[Canvas Index<br/>测试入口]
        B[Widget Canvas<br/>画布容器]
        C[Widget Render<br/>渲染器]
        D[Toolbar<br/>工具栏]
    end
    
    subgraph 核心业务层
        E[Widget Manager<br/>Widget管理器]
        F[A2UI Protocol Handler<br/>协议处理器]
        G[History Data Handler<br/>历史数据处理器]
    end
    
    subgraph 工具服务层
        H[Widget Loader<br/>加载器]
        I[Layout Calculator<br/>布局计算器]
        J[Script Loader<br/>脚本加载]
        K[Config Loader<br/>配置加载]
    end
    
    subgraph 数据通信层
        L[WebSocket Service<br/>实时推送]
        M[HTTP Service<br/>API请求]
    end
    
    A --> B
    B --> C
    A --> D
    A --> E
    E --> F
    E --> G
    E --> H
    E --> I
    H --> J
    H --> K
    F --> L
    H --> M
    G --> E
```

## 2. Widget 生命周期流程

```mermaid
stateDiagram-v2
    [*] --> 待加载: 接收Widget配置
    待加载 --> 加载中: 开始加载资源
    加载中 --> 加载失败: 资源加载失败
    加载中 --> 已加载: 资源加载成功
    已加载 --> 布局计算: 计算位置
    布局计算 --> 渲染中: 开始渲染
    渲染中 --> 已渲染: 渲染完成
    已渲染 --> 更新中: 接收更新消息
    更新中 --> 已渲染: 更新完成
    已渲染 --> 销毁中: 接收删除消息
    销毁中 --> [*]: 清理完成
    加载失败 --> 待加载: 重试
    加载失败 --> [*]: 放弃
```

## 3. 历史数据加载时序图

```mermaid
sequenceDiagram
    autonumber
    participant U as 用户
    participant C as Canvas
    participant H as HistoryHandler
    participant M as Manager
    participant L as Loader
    participant LC as LayoutCalculator
    participant R as Render
    
    U->>C: 打开页面
    C->>H: loadHistoryData(historyWidgets)
    H->>H: 分批处理<br/>每批5个
    
    loop 每批Widget
        H->>M: loadWidgetsBatch(batch)
        
        par 并行加载资源
            M->>L: loadScript(jsUrl)
            M->>L: loadConfig(configUrl)
        end
        
        L-->>M: 资源加载完成
        M->>L: registerComponent()
        M->>LC: calculateNextPosition(w, h)
        LC-->>M: 返回 x, y
        M->>R: renderWidget(widget)
        R->>R: 应用加载动画
        R-->>C: Widget渲染完成
        C->>U: 更新进度 20%
    end
    
    H-->>C: 所有历史数据加载完成
    C->>U: 显示完成提示
```

## 4. 实时推送处理流程

```mermaid
sequenceDiagram
    autonumber
    participant WS as WebSocket
    participant C as Canvas
    participant P as ProtocolHandler
    participant M as Manager
    participant R as Render
    
    WS->>C: 推送A2UI消息
    C->>P: handleMessage(message)
    P->>P: validateMessage()
    
    alt createSurface
        P->>M: 创建新Widget
        M->>M: loadWidget()
        M->>R: renderWidget()
        R-->>C: 新Widget已添加
    else updateComponents
        P->>M: updateWidget(surfaceId)
        M->>R: updateComponent()
        R-->>C: Widget已更新
    else updateDataModel
        P->>M: updateWidgetData(surfaceId)
        M->>R: updateData()
        R-->>C: 数据已更新
    else deleteSurface
        P->>M: removeWidget(surfaceId)
        M->>R: destroyWidget()
        R-->>C: Widget已删除
    end
```

## 5. 布局算法可视化

```mermaid
graph TB
    subgraph 12列网格布局
        direction LR
        A[0,0<br/>W1<br/>4x7]
        B[4,0<br/>W2<br/>4x7]
        C[8,0<br/>W3<br/>4x7]
        D[0,7<br/>W4<br/>6x5]
        E[6,7<br/>W5<br/>6x5]
        F[0,12<br/>W6<br/>8x6]
        G[8,12<br/>W7<br/>4x6]
    end
    
    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e8f5e9
    style E fill:#fff9c4
    style F fill:#ffebee
    style G fill:#e0f2f1
```

**布局规则说明：**
- 网格总列数：12 列
- 扫描顺序：从左到右、从上到下
- 位置计算：找到第一个能容纳当前 Widget 的空位
- 冲突检测：检查目标区域是否与已有 Widget 重叠

## 6. 数据流向图

```mermaid
flowchart TD
    A[远程服务器] -->|1. 推送A2UI消息| B[WebSocket Service]
    B -->|2. 解析消息| C{消息类型}
    
    C -->|createSurface| D[创建Widget流程]
    C -->|updateComponents| E[更新组件流程]
    C -->|updateDataModel| F[更新数据流程]
    C -->|deleteSurface| G[删除Widget流程]
    
    D --> H[Widget Loader]
    H -->|3. 加载JS| I[Script Loader]
    H -->|4. 加载配置| J[Config Loader]
    I --> K[注册Vue组件]
    J --> K
    K --> L[Layout Calculator]
    L -->|5. 计算位置| M[Widget Manager]
    M -->|6. 创建实例| N[Widget Canvas]
    N -->|7. 渲染| O[Widget Render]
    
    E --> M
    F --> M
    G --> M
    M --> N
    
    O -->|8. 显示| P[用户界面]
```

## 7. 模块依赖关系

```mermaid
graph TD
    A[Canvas Index] --> B[Widget Manager]
    A --> C[A2UI Protocol Handler]
    A --> D[History Data Handler]
    
    B --> E[Widget Loader]
    B --> F[Layout Calculator]
    B --> G[Widget Registry]
    
    E --> H[Script Loader]
    E --> I[Config Loader]
    E --> J[Component Registrar]
    
    C --> B
    D --> B
    
    B --> K[Widget Canvas]
    K --> L[Widget Render]
    
    M[WebSocket Service] --> A
    N[HTTP Service] --> E
    
    style A fill:#4CAF50,color:#fff
    style B fill:#2196F3,color:#fff
    style C fill:#FF9800,color:#fff
    style D fill:#9C27B0,color:#fff
    style K fill:#F44336,color:#fff
```

## 8. 错误处理流程

```mermaid
flowchart TD
    A[开始加载Widget] --> B{加载JS文件}
    B -->|成功| C{加载配置文件}
    B -->|失败| D{重试次数<3?}
    D -->|是| B
    D -->|否| E[显示错误提示]
    E --> F[记录错误日志]
    F --> G[跳过该Widget]
    
    C -->|成功| H{注册组件}
    C -->|失败| D
    
    H -->|成功| I{计算布局}
    H -->|失败| J[组件名冲突]
    J --> K[使用备用名称]
    K --> I
    
    I -->|成功| L{渲染Widget}
    I -->|失败| M[使用默认位置]
    M --> L
    
    L -->|成功| N[加载完成]
    L -->|失败| O[显示占位符]
    O --> F
    
    style E fill:#f44336,color:#fff
    style F fill:#ff9800,color:#fff
    style N fill:#4caf50,color:#fff
```

## 9. 性能优化策略图

```mermaid
mindmap
  root((性能优化))
    资源加载
      并发控制
        最多3个并发
      缓存机制
        内存缓存
        LocalStorage
      预加载
        常用Widget
      懒加载
        可视区域加载
    渲染优化
      虚拟滚动
        大量Widget
      分批渲染
        每批5个
      防抖节流
        resize事件
      RAF优化
        动画帧
    内存优化
      组件销毁
        清理监听器
      数据清理
        定期GC
      弱引用
        临时数据
    代码优化
      Tree Shaking
      代码分割
      Gzip压缩
```

## 10. 安全防护机制

```mermaid
flowchart LR
    A[远程资源] --> B{来源验证}
    B -->|不可信| C[拒绝加载]
    B -->|可信| D{内容验证}
    
    D -->|格式错误| C
    D -->|格式正确| E{大小检查}
    
    E -->|超过限制| C
    E -->|符合要求| F{XSS检测}
    
    F -->|发现威胁| C
    F -->|安全| G[Sanitize处理]
    
    G --> H[加载资源]
    H --> I[沙箱执行]
    I --> J[注册组件]
    
    C --> K[记录安全日志]
    K --> L[通知管理员]
    
    style C fill:#f44336,color:#fff
    style J fill:#4caf50,color:#fff
```

## 11. 测试覆盖范围

```mermaid
pie title 测试覆盖范围
    "单元测试" : 40
    "集成测试" : 30
    "E2E测试" : 20
    "性能测试" : 10
```

**测试详情：**

- **单元测试 (40%)**
  - Widget Loader 测试
  - Layout Calculator 测试
  - Protocol Handler 测试
  - 工具函数测试

- **集成测试 (30%)**
  - Widget 完整加载流程
  - A2UI 消息处理流程
  - 历史数据加载流程

- **E2E 测试 (20%)**
  - 用户操作流程
  - 多场景测试
  - 兼容性测试

- **性能测试 (10%)**
  - 加载性能测试
  - 渲染性能测试
  - 内存泄漏测试

## 12. 部署架构

```mermaid
graph TB
    subgraph 前端部署
        A[Nginx] --> B[静态资源]
        A --> C[HTML/CSS/JS]
    end
    
    subgraph 后端服务
        D[API Server] --> E[Widget配置服务]
        D --> F[WebSocket服务]
    end
    
    subgraph CDN
        G[Widget JS文件]
        H[Widget配置文件]
    end
    
    subgraph 监控
        I[日志服务]
        J[性能监控]
        K[错误追踪]
    end
    
    A --> D
    B --> G
    B --> H
    D --> I
    A --> J
    D --> K
```

---

## 总结

以上架构图从多个维度展示了 A2UI Widget 系统的设计：

1. **整体架构**：展示了系统的分层结构
2. **生命周期**：描述了 Widget 从创建到销毁的完整流程
3. **时序图**：详细说明了各模块之间的交互顺序
4. **布局算法**：可视化展示了网格布局的计算方式
5. **数据流向**：清晰展示了数据在系统中的流转路径
6. **依赖关系**：说明了各模块之间的依赖关系
7. **错误处理**：完善的错误处理和降级策略
8. **性能优化**：多维度的性能优化方案
9. **安全防护**：全面的安全防护机制
10. **测试覆盖**：完整的测试策略
11. **部署架构**：生产环境的部署方案

这些图表配合主设计文档，能够帮助团队更好地理解系统设计，为后续的开发实施提供清晰的指导。
