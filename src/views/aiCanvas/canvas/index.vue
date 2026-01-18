<template>
  <div class="canvas-page">
    <toolbar />
    <div class="canvas-content">
      <div class="canvas-actions">
        <p-button
          type="primary"
          @click="handleUpdateDom"
          size="small"
        >
          <p-icon type="pui-refresh" />
          大批量更新widget（a2ui）
        </p-button>
        <p-button
          type="primary"
          @click="handleUpdateData"
          size="small"
        >
          <p-icon type="pui-database" />
          单个或几个更新widget（a2ui）
        </p-button>
      </div>
      <div class="canvas-wrapper">
        <widget-canvas />
      </div>
    </div>
  </div>
</template>

<script>
import toolbar from './components/toolbar.vue';
import widgetCanvas from './components/widgetCanvas.vue';

export default {
  name: "CanvasPage",
  components: {
    toolbar,
    widgetCanvas
  },
  data() {
    return {
      widgetConfig: [
        {
          title: "图表",
          widgetId: "line-chart",
          w: 6,
          h: 7,
          resizable: true,
          draggable: true,
          props: {
            data: "Array",
            style: {
              showLegend: false,
            }
          }
        }
      ],
      message: {
        createSurface: {
          surfaceId: "trend_chart",
          catalogId: "https://www.h3c.com/ai-canvas/spec/a2ui/0.9/catalog_definition.json"
        },
        updatecomponents: {
          surfaceId: "trend_chart",
          components: [
            {
              id: "root",
              component: "widgetTrendChart",
              title: "CPU",
              xAxisName: "时间",
              yAxisName: { path: "/perf/yAxisName" },
              data: { path: "/perf/data" },
            }
          ]
        },
        updateDataModel: {
          surfaceId: "trend_chart",
          path: "/perf",
          op: "replace",
          value: {
            yAxisName: "CPU使用率",
            data: '[{"xAxis":"2026-01-08 19:34:25","yAxis":99.9}]'
          }
        },
        deleteSurface: {
          surfaceId: "trend_chart"
        }
      }
    };
  },
  created() {},
  mounted() {},
  methods: {
    handleUpdateDom() {
      console.log("更新DOM");
    },
    handleUpdateData() {
      console.log("更新数据");
    }
  }
};
</script>

<style lang="less" scoped>
.canvas-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7f9;
}

.canvas-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .canvas-actions {
    padding: 16px 20px;
    background: #ffffff;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    gap: 12px;
    flex-shrink: 0;
  }
  
  .canvas-wrapper {
    flex: 1;
    padding: 0;
    overflow: hidden;
  }
}
</style>