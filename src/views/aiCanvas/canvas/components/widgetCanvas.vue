<template>
  <div class="canvas-container">
    <div v-if="layout.length === 0" class="empty-state">
      <div class="empty-icon"></div>
      <h3>Widget...</h3>
      <p>AIWidget</p>
    </div>
    
    <grid-layout
      v-else
      :layout="layout"
      :col-num="colNum"
      :row-height="rowHeight"
      :is-draggable="draggable"
      :is-resizable="resizable"
      :margin="[8, 8]"
      :vertical-compact="true"
      :use-css-transforms="true"
      :edit="false"
    >
      <grid-item
        v-for="item in layout"
        :key="item.surfaceId"
        :x="item.x"
        :y="item.y"
        :w="item.w || 4"
        :h="item.h || 7"
        :i="item.surfaceId"
        :is-resizable="item.resizable"
        :edit="false"
        @resize="resizeEvent"
        @resized="resizedEvent"
      >
        <template v-slot:header>
          <div
            v-if="item?.tipLocale && item?.tipLocale[language]"
            class="other-title"
          >
            <p-tooltip :content="item?.tipLocale[language]">
              <p-icon type="pui-help"></p-icon>
            </p-tooltip>
          </div>
        </template>
        
        <widget-render
          :widgetId="item.widgetId"
          :surfaceId="item.surfaceId"
          :data="item.data"
          :resize="resize"
          :lang="language"
          :theme="themeId"
        ></widget-render>
      </grid-item>
    </grid-layout>
  </div>
</template>

<script>
import { GridItem, GridLayout } from "@/components/vue-grid-layout/index";

export default {
  name: "gridCanvas",
  components: {
    GridItem,
    GridLayout,
    widgetRender: () => import("./widgetRender.vue")
  },
  data() {
    return {
      layout: [
        {
          surfaceId: "widget-1",
          title: "widget-base-line-chart",
          widgetId: "widget-base-line-chart",
          x: 0,
          y: 0,
          w: 4,
          h: 7,
          resizable: true,
          draggable: true,
          data: {
            title: "",
            categories: ["A", "B", "C", "D", "E", "F", "G"],
            series: [
              { name: "A", data: [120, 132, 101, 134, 90, 230, 210] },
              { name: "B", data: [220, 182, 191, 234, 290, 330, 310] },
              { name: "C", data: [150, 232, 201, 154, 190, 330, 410] },
              { name: "D", data: [320, 332, 301, 334, 390, 330, 320] },
              { name: "E", data: [820, 932, 901, 934, 1290, 1330, 1320] },
              { name: "F", data: [620, 732, 601, 734, 890, 930, 920] }
            ]
          }
        },
        {
          surfaceId: "widget-2",
          title: "widget-base-pie-chart",
          widgetId: "widget-base-pie-chart",
          x: 4,
          y: 0,
          w: 4,
          h: 7,
          resizable: true,
          draggable: true,
          data: {
            title: "",
            xData: ["A", "B", "C", "D", "E", "F"],
            yData: [
              { name: "A", value: 120 },
              { name: "B", value: 220 },
              { name: "C", value: 150 },
              { name: "D", value: 320 },
              { name: "E", value: 820 },
              { name: "F", value: 620 }
            ]
          }
        },
        {
          surfaceId: "widget-3",
          title: "widget-base-card",
          widgetId: "widget-base-card",
          x: 8,
          y: 0,
          w: 4,
          h: 7,
          resizable: true,
          draggable: true,
          data: {
            title: "",
            type: "bar",
            vData: [
              { name: "A", value: 120 },
              { name: "B", value: 220 },
              { name: "C", value: 150 },
              { name: "D", value: 320 },
              { name: "E", value: 820 },
              { name: "F", value: 620 }
            ],
            miniChartData: [
              [120, 132, 101, 134, 90, 230, 210],
              [220, 182, 191, 234, 290, 330, 310],
              [150, 232, 201, 154, 190, 330, 410],
              [320, 332, 301, 334, 390, 330, 320],
              [820, 932, 901, 934, 1290, 1330, 1320],
              [620, 732, 601, 734, 890, 930, 920]
            ]
          }
        }
      ],
      draggable: true,
      resizable: true,
      minW: 2,
      colNum: 12,
      rowHeight: 30,
      resize: true
    };
  },
  computed: {
    language() {
      return localStorage.getItem("language") || "zh-CN";
    },
    themeId() {
      return localStorage.getItem("themeId") || "light";
    }
  },
  mounted() {
    window.colNum = this.colNum;
    window.minW = this.minW;
    this.initRowH();
    
    window.addEventListener("resize", () => {
      this.resizeWin(true);
    });
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resizeWin);
  },
  methods: {
    clone(obj) {
      return JSON.parse(JSON.stringify(obj));
    },
    resizeWin(isWin = false) {
      if (isWin) {
        this.initRowH();
      }
      setTimeout(() => {
        this.resize = !this.resize;
      }, 1);
    },
    initRowH() {
      let autoWidth = this.colNum || 12;
      const container = document.querySelector(".canvas-container");
      if (!container) return;
      
      let rowHeight = Math.floor(
        (container.clientWidth / autoWidth) * this.minW * 0.618 * 2
      );
      this.rowHeight = Math.floor(rowHeight / 9);
    },
    resizeEvent(i, newH, newW, newHPx, newWPx) {
      console.log(
        "RESIZE i=" + i +
        ", H=" + newH + ", W=" + newW +
        ", Hpx=" + newHPx + ", Wpx=" + newWPx
      );
      this.resizeWin();
    },
    resizedEvent(i, newH, newW, newHPx, newWPx) {
      console.log(
        "RESIZE END i=" + i +
        ", H=" + newH + ", W=" + newW +
        ", Hpx=" + newHPx + ", Wpx=" + newWPx
      );
      this.resizeWin();
    }
  }
};
</script>

<style lang="less" scoped>
.canvas-container {
  height: 100%;
  background: #f8f9fa;
  overflow: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  text-align: center;
  
  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.6;
  }
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    font-size: 14px;
    opacity: 0.8;
  }
}

.vue-grid-layout {
  height: 100%;
  position: relative;
}

.vue-grid-item {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e8e8e8;
  
  .widget-card {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .widget-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
    
    h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .widget-id {
      font-size: 12px;
      opacity: 0.8;
      font-family: monospace;
    }
  }
  
  .widget-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
  
  .data-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .data-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #007bff;
    
    .data-label {
      font-weight: 600;
      color: #495057;
      min-width: 100px;
      font-size: 13px;
    }
    
    .data-value {
      flex: 1;
      color: #6c757d;
      font-size: 13px;
      line-height: 1.4;
    }
  }
}

.widget-card {
  height: 100%;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
  
  .widget-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .widget-id {
      font-size: 12px;
      opacity: 0.8;
      font-family: monospace;
    }
  }
  
  .widget-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
  
  .data-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .data-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #007bff;
    
    .data-label {
      font-weight: 600;
      color: #495057;
      min-width: 100px;
      font-size: 13px;
    }
    
    .data-value {
      flex: 1;
      color: #6c757d;
      font-size: 13px;
      line-height: 1.4;
    }
  }
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  font-style: italic;
}

/* Widget specific styles */
.vue-grid-item.static .widget-card {
  border-left: 4px solid #1890ff;
}

.vue-grid-item:not(.static) .widget-card {
  border-left: 4px solid #52c41a;
}
</style>