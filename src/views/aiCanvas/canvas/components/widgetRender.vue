<template>
  <component
    v-if="isDev"
    :is="widgetId"
    class="widget-wrapper"
    :surface-id="surfaceId"
    :data="JSON.stringify(data || {})"
    :resize="resize"
    :lang="lang"
    :theme="theme"
    @refreshWidget="refreshWidget"
  >
  </component>

  <render-template
    v-else
    class="widget-wrapper"
    :surface-id="surfaceId"
    :data="data"
    :resize="resizeFlag"
    :lang="lang"
    :theme="theme"
    @refreshWidget="refreshWidget"
  >
  </render-template>
</template>

<script>
import Vue from "vue";

// 定义全局组件 render-template
Vue.component("render-template", {
  render(createElement) {
    return createElement(this.widgetId, {
      attrs: {
        surfaceId: this.surfaceId,
        data: JSON.stringify(this.data),
        lang: this.lang,
        theme: this.theme,
        resize: this.resize,
      },
      on: {
        refreshWidget: this.refreshWidget,
      },
    });
  },
  props: {
    surfaceId: {
      type: [String, Number],
    },
    // widget data
    data: {
      type: [Object, Array],
      default() {
        return [];
      },
    },
    lang: {
      type: String,
      default() {
        return "zh";
      },
    },
    theme: {
      type: String,
      default() {
        return "star";
      },
    },
    resize: {
      type: Boolean,
    },
  },
  created() {
    document.addEventListener("loadingData", this.loadingData);
  },
  beforeDestroy() {
    document.removeEventListener("loadingData", this.loadingData);
  },
  methods: {
    refreshWidget(param) {
      this.$emit("refreshWidget", param);
    },
  },
});

// 默认导出组件
export default {
  name: "Widget",
  components: {},
  props: {
    widgetId: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    surfaceId: {
      type: [String, Number],
      default: "",
    },
    // widget data
    data: {
      type: [Object, Array],
      default() {
        return [];
      },
    },
    resize: {
      type: Boolean,
    },
    lang: {
      type: String,
      default() {
        return "zh-CN";
      },
    },
    theme: {
      type: String,
      default() {
        return "star";
      },
    },
  },
  data() {
    return {
      resizeFlag: false,
      isDev: process.env.NODE_ENV === "development",
    };
  },
  methods: {
    refreshWidget(param) {
      this.$emit("refreshWidget", param);
    },
  },
  created() {},
  mounted() {},
  watch: {
    resize() {
      setTimeout(() => {
        this.resizeFlag = !this.resizeFlag;
      });
    },
  },
};
</script>

<style scoped lang="less">
.widget {
  width: 100%;
  height: 100%;

  .chartwrapper {
    width: 100%;
    height: 100%;
  }
}
</style>
