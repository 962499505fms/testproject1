<template>
  <div
    ref="item"
    class="vue-grid-item"
    :data-id="i"
    :class="classObj"
    :style="style"
  >
    <div class="vue-grid-item-box">
      <template v-if="isGroup">
        <div :class="`groupBox groupBox-${expanded}`">
          <div class="groupTitle cursor">
            <div class="ivu-collapsefield-label" @click="onClickGroup">
              <span
                :class="`ivu-collapsefield-icon iconfont icon-jiantou-${
                  expanded ? 'xia' : 'you'
                }`"
              ></span>
            </div>
            <span> {{ title }} ({{ childNum }})</span>
          </div>
          <div class="groupOper">
            <span
              class="iconfont icon-bianji plR4"
              @click.stop="editGroupName"
            ></span>
            <span
              class="iconfont icon-shanchu pLR4"
              @click.stop="deleteItem"
            ></span>
          </div>
        </div>
      </template>

      <template v-else>
        <div
          class="vue-draggable-handle flexbar"
          v-show="showTitle && defaultTitle"
          :class="[!(showHandle || showTitle) && 'no-border']"
        >
          <div class="flexbar-left">
            <div
              class="title"
              :title="title"
              :style="{ color: $theme === 'white' ? '#000000e6' : '#ffffffe6' }"
            >
              <span
                v-show="leftStyle"
                class="iconfont icon-pui-icon-drag pR4"
              ></span>
              {{ title }}
            </div>
            <div class="body">
              <slot name="header"></slot>
            </div>
          </div>
        </div>
        <div
          class="no-drag widget-box"
          :class="[!(showTitle && defaultTitle) && 'no-header']"
        >
          <slot></slot>
        </div>
      </template>

      <div
        class="vue-draggable-handle oper-drag"
        v-if="!(showTitle && defaultTitle) && !leftStyle && isEdit"
      >
        <p-icon type="pui-drag"></p-icon>
      </div>
      <div
        class="oper-drag"
        :title="$t('watch')"
        v-if="isView"
        @click="handleItemDoubleClick(i)"
        style="cursor: pointer"
      >
        <span class="iconfont icon-chakan pLR4"></span>
      </div>

      <div class="oper" v-if="!leftStyle">
        <span
          class="iconfont icon-shuaxin pLR4"
          :title="$t('refresh')"
          v-if="isView"
          @click="updateWidget"
        >
        </span>

        <p-dropdown
          V-if="isEdit"
          stop-propagation
          placement="bottom-end"
          trigger="click"
          @on-click="onOpt"
        >
          <p-icon type="pui-more" :title="$t('more')"></p-icon>
          <p-dropdownmenu slot="list">
            <p-dropdownitem
              name="4"
              v-show="!leftStyle"
              style="display: flex; align-items: center"
            >
              <span class="iconfont icon-chakan pLR4"></span>
              <span>{{ $t("watch") }}</span>
            </p-dropdownitem>
            <p-dropdownitem name="1" v-show="!leftStyle">
              <span class="iconfont icon-shuaxin pLR4"></span>
              <span>{{ $t("refresh") }}</span>
            </p-dropdownitem>
            <p-dropdownitem name="2" v-show="!leftStyle && !hideEdit">
              <span class="iconfont icon-bianji pLR4"></span>
              <span>{{ $t("modify") }}</span>
            </p-dropdownitem>
            <p-dropdownitem name="3" v-show="!leftStyle">
              <span class="iconfont icon-shanchu pLR4"></span>
              <span>{{ $t("delete") }}</span>
            </p-dropdownitem>
          </p-dropdownmenu>
        </p-dropdown>
      </div>
    </div>

    <span
      v-if="resizableAndNotStatic && showHandle && isEdit"
      ref="handle"
      :class="resizableHandleClass"
    >
      <span class="iconfont icon-wanxiang" v-if="!fixedHeight && !fixedWidth">
      </span>
      <span class="iconfont icon-xia" v-if="fixedHeight && fixedWidth"></span>
    </span>
  </div>
</template>
<style lang="less" scoped>
.vue-grid-item-box {
  position: relative;
  height: 100%;
  width: 100%;

  &:hover {
    .oper {
      display: block;
    }

    .oper-drag {
      display: block;
    }
  }
}

.flexbar {
  justify-content: space-between;
  display: flex;
  width: 100%;
  padding: 4px 4px;

  .no-border {
    border: none;
  }

  .ivu-icon {
    cursor: pointer;
  }

  .flexbar-left {
    flex: 1;
    max-width: 100%;

    .body {
      max-width: 20px;
      display: inline-block;
      vertical-align: middle;
    }

    .title {
      max-width: calc(~"100% - 50px");
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre;
      display: inline-block;
      vertical-align: middle;
      font-weight: 600;
    }
  }

  .oper {
    width: auto;
    text-align: right;
  }
}

.vue-grid-item {
  transition: all 200ms ease;
  transition-property: left, top, right;
  border-radius: 3px;
  border: none;
  z-index: 0;

  &:hover {
    z-index: 1;
  }
}

.isGroup {
  background: transparent;
  border-radius: unset;
}

.noExpandedGroup {
  border-bottom: 1px solid var(--border-split-color, #e8e8e7);
}

/deep/.ivu-select-dropdown {
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.15);
  border: none;
}

.oper-drag {
  position: absolute;
  width: 24px;
  height: 24px;
  right: 24px;
  top: 0;
  padding-top: 0px;
  z-index: 999;
  display: none;
  background: rgba(204, 204, 220, 0.14);
  font-size: 16px;
  text-align: center;
}

.oper {
  position: absolute;
  width: 24px;
  height: 24px;
  right: 0;
  top: 0;
  padding-top: 0px;
  padding: 0 2px;
  text-align: center;
  z-index: 999;
  display: none;
  background: rgba(204, 204, 220, 0.14);
  border-radius: 0 3px 0 0;
  font-size: 16px;
  cursor: pointer;
}

.iconfont {
  font-size: 16px;
}

.widget-box {
  width: 100%;
  height: calc(~"100% - 28px");
  overflow: hidden;
  padding: 0px 8px 8px;
}

.no-header {
  height: 100%;
  padding: 8px 8px;
}

.vue-grid-item.no-touch {
  -ms-touch-action: none;
  touch-action: none;
}

.vue-grid-item.cssTransforms {
  transition-property: transform;
  left: 0;
  right: auto;
}

.vue-grid-item.cssTransforms.render-rtl {
  left: auto;
  right: 0;
}

.vue-grid-item.resizing {
  opacity: 0.6;
  z-index: 3;
}

.vue-grid-item.vue-draggable-dragging {
  transition: none;
  z-index: 3;
}

.vue-grid-item.vue-grid-placeholder {
  background: #2668db;
  opacity: 0.2;
  transition-duration: 100ms;
  z-index: 2;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;
}

.vue-grid-item > .vue-resizable-hande {
  position: absolute;
  width: 16px;
  height: 16px;
  bottom: 0;
  right: 0;
  background: none;
  background-position: bottom right;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: se-resize;
  z-index: 2000;
  transform: rotate(90deg);
}

.vue-grid-item > .vue-resizable-handle .ivu-icon {
  position: absolute;
  right: 16px;
  top: 6px;
}

.vue-grid-item > .vue-resizable-handle-h {
  transform: rotate(90deg);
  top: 50%;
  cursor: e-resize;
}

.vue-grid-item > .vue-resizable-handle-h .ivu-icon {
  right: 15px;
  bottom: 0;
}

.vue-grid-item > .vue-resizable-handle-w {
  transform: rotate(0deg) translateX(25px);
  right: 50%;
  cursor: n-resize;
}

.vue-grid-item > .vue-resizable-handle-w .ivu-icon {
  top: 34px;
}

.vue-grid-item > .vue-rtl-resizable-handle {
  bottom: 0;
  left: 0;
  background-position: bottom left;
  padding-left: 3px;
  background-repeat: no-repeat;
  background-origin: content-box;
  cursor: sw-resize;
  right: auto;
}

.vue-resizable-handle > .icon-wanxiang {
  height: 16px;
  width: 16px;
  position: relative;
  right: 2px;
  bottom: 2px;
  display: inline-block;
  transform: rotate(-90deg);
  cursor: se-resize;
}

.vue-resizable-handle-w > .icon-xia {
  cursor: n-resize;
}

.vue-resizable-handle-h > .icon-xia {
  position: relative;
  bottom: 7px;
  cursor: e-resize;
}

.vue-grid-item.disable-userselect {
  user-select: none;
}

leftStyle {
  border-radius: 0px;

  .flexbar {
    border: none;
  }

  .widget-box {
    padding-top: 0px;
  }
}

.leftStyleNotfirst {
  border-top: @border-split-color 1px solid;
}

.groupBox {
  width: 100%;
  padding: 0px 10px;
  display: flex;
  align-items: center;

  .groupTitle {
    display: flex;
    align-items: center;

    .ivu-collapsefield-label {
      margin: 0px;
    }
  }

  .groupOper {
    padding-left: 16px;
  }
}

.groupBox-true {
  cursor: default;
}

.ivu-icon-pui-drag {
  cursor: move;
}
</style>
<script>
import {
  setTopLeft,
  setTopRight,
  setTransformRtl,
  setTransform,
} from "./helpers/utils";
import { getControlPosition, createCoreData } from "./helpers/draggableUtils";
import { getColsFromBreakpoint } from "./helpers/responsiveUtils";
import { getDocumentDir } from "./helpers/DOM";
import "@interactjs/auto-start";
import "@interactjs/actions/drag";
import "@interactjs/actions/resize";
import "@interactjs/modifiers";
import "@interactjs/dev-tools";
import interact from "@interactjs/interact";

export default {
  name: "GridItem",
  props: {
    showTitle: {
      type: Boolean,
      default: true,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    childNum: {
      type: Number,
      default: 0,
    },
    expanded: {
      type: Boolean,
      default: false,
    },
    isDraggable: {
      type: Boolean,
      required: false,
      default: null,
    },

    isResizable: { type: Boolean, required: false, default: null  },
    static: {
      type: Boolean,
      required: false,
      default: false,
    },
    minH: {
      type: Number,
      required: false,
      default: 1,
    },
    minW: {
      type: Number,
      required: false,
      default: 1,
    },
    maxH: {
      type: Number,
      required: false,
      default: Infinity,
    },
    maxW: {
      type: Number,
      required: false,
      default: Infinity,
    },
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },

    W: {
      type: Number,
      required: true,
      default: 4,
    },
    h: {
      type: Number,
      required: true,
      default: 7,
    },
    above: {
      type: Number,
      default: 0,
    },
    i: {
      required: true,
      default: "unknown",
    },
    dragIgnoreFrom: {
      type: String,
      required: false,
      default: "a, button",
    },
    dragAllowFrom: {
      type: String,
      required: false,
      default: null,
    },
    resizeIgnoreFrom: {
      type: String,
      required: false,
      default: "a, button",
    },
    scaleRatio: { type: Number, default: 1 },
    fixedWidth: { type: Boolean, default: false },
    fixedHeight: { type: Boolean, default: false },
    leftStyle: { type: Boolean, default: false },
    aspectRatio: { type: Number, default: -1 },
    showHandle: { type: Boolean, default: true },
    hideEdit: {
      type: Boolean,
      default: false,
    },
    defaultTitle: String,
  },

  inject: ["eventBus", "layout"],

  data: function () {
    return {
      cols: 1,
      containerWidth: 100,
      rowHeight: 30,
      margin: [10, 10],
      maxRows: Infinity,
      draggable: null,
      resizable: null,
      useCssTransforms: true,
      useStyleCursor: true,
      isDragging: false,
      dragging: null,
      isResizing: false,
      resizing: null,
      lastX: NaN,
      lastY: NaN,
      lastW: NaN,
      lastH: NaN,
      style: {},
      styleValue: {},
      rtl: false,
      startSize: {},
      dragEventSet: false,
      resizeEventSet: false,
      previousW: null,
      previousH: null,
      previousX: null,
      previousY: null,
      innerX: this.x,
      innerY: this.y,
      innerW: this.w,
      innerH: this.h,
      click: true,
      title: this.defaultTitle,
      isEditTitle: false,
    };
  },

  created() {
    let self = this;
    self.updateWidthHandler = function (width) {
      self.updateWidth(width);
    };

    self.compactHandler = function (layout) {
      self.compact(layout);
    };

    self.setDraggableHandler = function (isDraggable) {
      if (self.isDraggable === null) self.draggable = isDraggable;
    };

    self.setResizableHandler = function (isResizable) {
      if (self.isResizable === null) self.resizable = isResizable;
    };

    self.setRowHeightHandler = function (rowHeight) {
      self.rowHeight = rowHeight;
    };

    self.setMaxRowsHandler = function (maxRows) {
      self.maxRows = maxRows;
    };

    self.directionchangeHandler = () => {
      this.rtl = getDocumentDir() === "rtl";
      this.compact();
    };

    self.setColNum = (colNum) => {
      self.cols = parselnt(colNum);
    };

    this.eventBus.$on("updateWidth", self.updateWidthHandler);
    this.eventBus.$on("compact", self.compactHandler);
    this.eventBus.$on("setDraggable", self.setDraggableHandler);
    this.eventBus.$on("setResizable", self.setResizableHandler);
    this.eventBus.$on("setRowHeight", self.setRowHeightHandler);
    this.eventBus.$on("setMaxRows", self.setMaxRowsHandler);
    this.eventBus.$on("directionchange", self.directionchangeHandler);
    this.eventBus.$on("setColNum", self.setColNum);
    this.rtl = getDocumentDir() === "rtl";
  },

  beforeDestroy: function () {
    let self = this;
    this.eventBus.$off("updateWidth", self.updateWidthHandler);
    this.eventBus.$off("compact", self.compactHandler);
    this.eventBus.$off("setDraggable", self.setDraggableHandler);
    this.eventBus.$off("setResizable", self.setResizableHandler);
    this.eventBus.$off("setRowHeight", self.setRowHeightHandler);
    this.eventBus.$off("setMaxRows", self.setMaxRowsHandler);
    this.eventBus.$off("directionchange", self.directionchangeHandler);
    this.eventBus.$off("setColNum", self.setColNum);
    if (this.interactObj) {
      this.interactObj.unset();
    }
  },

  mounted: function () {
    if (this.layout.responsive && this.layout.lastBreakpoint) {
      this.cols = getColsFromBreakpoint(
        this.layout.lastBreakpoint,
        this.layout.cols,
      );
    } else {
      this.cols = this.layout.colNum;
    }

    this.rowHeight = this.layout.rowHeight;
    this.containerWidth = this.layout.width !== null ? this.layout.width : 100;
    this.margin =
      this.layout.margin !== undefined ? this.layout.margin : [10, 10];

    this.maxRows = this.layout.maxRows;

    if (this.isDraggable === null) {
      this.draggable = this.layout.isDraggable;
    } else {
      this.draggable = this.isDraggable;
    }
    if (this.isResizable === null) {
      this.resizable = this.layout.isResizable;
    } else {
      this.resizable = this.isResizable;
    }

    this.useCssTransforms = this.layout.useCssTransforms;
    this.useStyleCursor = this.layout.useStyleCursor;
    this.createStyle();
    this.$emit("initStyle", this.styleValue);
  },

  watch: {
    defaultTitle(val) {
      this.title = val || this.i;
    },

    isDraggable: function () {
      this.draggable = this.isDraggable;
    },
    static: function () {
      this.tryMakeDraggable();
      this.tryMakeResizable();
    },

    draggable: function () {
      this.tryMakeDraggable();
    },
    isResizable: function () {
      this.resizable = this.isResizable;
    },

    resizable: function () {
      this.tryMakeResizable();
    },

    rowHeight: function () {
      this.createStyle();
      this.emitContainerResized();
    },

    above: function () {
      this.createStyle();
      this.emitContainerResized();
    },
    cols: function () {
      this.tryMakeResizable();
      this.createStyle();
      this.emitContainerResized();
    },
    containerWidth: function () {
      this.tryMakeResizable();
      this.createStyle();
      this.emitContainerResized();
    },

    x: function (newVal) {
      this.innerX = newVal;
      this.createStyle();
      this.emitContainerResized();
    },
    y: function (newVal) {
      this.innerY = newVal;
      this.createStyle();
      this.emitContainerResized();
    },

    h: function (newVal) {
      this.innerH = newVal;
      this.createStyle();
    },
    w: function (newVal) {
      this.innerW = newVal;
      this.createStyle();
    },
    renderRtl: function () {
      this.tryMakeResizable();
      this.createStyle();
    },
    minH: function () {
      this.tryMakeResizable();
    },
    maxH: function () {
      this.tryMakeResizable();
    },
    minW: function () {
      this.tryMakeResizable();
    },
    maxW: function () {
      this.tryMakeResizable();
    },

    "$parent.margin": function (margin) {
      if (
        !margin ||
        (margin[0] == this.margin[0] && margin[1] == this.margin[1])
      ) {
        return;
      }
      this.margin = margin.map((m) => Number(m));
      this.createStyle();
      this.emitContainerResized();
    },

    "$parent.$parent.margin": function (margin) {
      if (
        !margin ||
        (margin[0] == this.margin[0] && margin[1] == this.margin[1])
      ) {
        return;
      }
      this.margin = margin.map((m) => Number(m));
      this.createStyle();
      this.emitContainerResized();
    },

    isEditTitle() {
      this.draggable = !this.isEditTitle;
      if (this.isEditTitle) {
        this.$nextTick(() => {
          this.$refs.titleInput.focus();
        });
      }
    },
  },
  computed: {
    isView() {
      const view = this.$Utils.getUrlParams("mode") || "";
      return Boolean(view === "view" || !view);
    },
    isEdit() {
      const edit = this.$Utils.getUrlParams("mode") || "";
      return Boolean(edit && edit === "edit");
    },

    classObj() {
      return {
        "vue-resizable": this.resizableAndNotStatic,
        static: this.static,
        isGroup: this.isGroup,
        expanded: this.expanded,
        noExpandedGroup: this.isGroup && !this.expanded,
        resizing: this.isResizing,
        "vue-draggable-dragging": this.isDragging,
        cssTransforms: this.useCssTransforms,
        "render-rtl": this.renderRtl,
        "disable-userselect": this.isDragging,
        "no-touch": this.isAndroid && this.draggableOrResizableAndNotStatic,
        "grid-layout-item": true,
        leftStyle: this.leftStyle,
        leftStyleNotfirst: this.leftStyle && this.y !== 0,
      };
    },

    resizableAndNotStatic() {
      return this.resizable && !this.static && !this.expanded;
    },
    draggableOrResizableAndNotStatic() {
      return (
        (this.draggable || this.resizable) && !this.static && !this.expanded
      );
    },

    isAndroid() {
      return navigator.userAgent.toLowerCase().indexOf("android") !== -1;
    },

    renderRtl() {
      return this.layout.isMirrored ? !this.rtl : this.rtl;
    },

    resizableHandleClass() {
      if (this.renderRtl) {
        return "vue-resizable-handle vue-rtl-resizable-handle";
      } else {
        return `vue-resizable-handle ${
          this.fixedHeight ? "vue-resizable-handle-h" : ""
        }${this.fixedWidth ? "vue-resizable-handle-w" : ""}`;
      }
    },
  },

  methods: {
    editGroupName() {
      console.log(this.i);
      this.$emit("editGroupName", this.i);
    },
    onClickGroup() {
      this.$emit("expandedItem", this.i);
    },
    deleteItem() {
      this.$emit("deleteItem", this.i);
    },

    updateWidget() {
      this.$emit("updateWidget", this.i);
    },
    clickItem() {
      this.$emit("clickItem", this.i);
    },

    createStyle: function () {
      if (this.x + this.w > this.cols) {
        this.innerX = 0;
        this.innerW = this.w > this.cols ? this.cols : this.w;
      } else {
        this.innerX = this.x;
        this.innerW = this.w;
      }

      let pos = this.calcPosition(
        this.innerX,
        this.innerY,
        this.innerW,
        this.innerH,
      );

      if (this.isDragging) {
        pos.top = this.dragging.top;
        if (this.renderRtl) {
          pos.right = this.dragging.left;
        } else {
          pos.left = this.dragging.left;
        }
      }

      if (this.isResizing) {
        pos.width = this.resizing.width;
        pos.height = this.resizing.height;
      }

      let style;
      if (this.useCssTransforms) {
        if (this.renderRtl) {
          style = setTransformRtl(pos.top, pos.right, pos.width, pos.height);
        } else {
          style = setTransform(pos.top, pos.left, pos.width, pos.height);
        }
      } else {
        if (this.renderRtl) {
          style = setTopRight(pos.top, pos.right, pos.width, pos.height);
        } else {
          style = setTopLeft(pos.top, pos.left, pos.width, pos.height);
        }
      }
      this.styleValue = {
        x: pos.left,
        y: pos.top,
        width: pos.width,
        height: pos.height,
      };
      this.style = style;
    },

    emitContainerResized() {
      let styleProps = {};
      for (let prop of ["width", "height"]) {
        let val = this.style[prop];
        let matches = val.match(/^(\d+)px$/);
        if (!matches) return;
        styleProps[prop] = matches[1];

        let newSize = this.calcPosition(
          this.innerX,
          this.innerY,
          this.innerW,
          this.innerH,
        );
        this.$emit(
          "container-resized",
          this.i,
          this.h,
          this.w,
          newSize.height,
          newSize.width,
          newSize.left,
          newSize.top,
        );
      }
    },

    handleResize: function (event) {
      if (this.static) return;
      if (this.expanded) return;
      const position = getControlPosition(event);
      if (position == null) return; //notpossible but satisfies flow
      let { x, y } = position;
      x = x / this.scaleRatio;
      y = y / this.scaleRatio;
      const newSize = { width: 0, height: 0, left: 0, top: 0 };
      switch (event.type) {
        case "resizestart": {
          this.previousW = this.innerW;
          this.previousH = this.innerH;
          pos = this.calcPosition(
            this.innerX,
            this.innerY,
            this.innerW,
            this.innerH,
          );
          newSize.width = pos.width;
          newSize.height = pos.height;
          newSize.left = pos.left;
          newSize.top = pos.top;
          this.resizing = newSize;
          this.isResizing = true;
          this.startSize = newSize;
          break;
        }

        case "resizemove": {
          const coreEvent = createCoreData(this.lastW, this.lastH, x, y);
          newSize.width = this.resizing.width;
          newSize.height = this.resizing.height;

          if (!this.fixedWidth) {
            if (this.renderRtl) {
              newSize.width = this.resizing.width - coreEvent.deltaX;
            } else {
              newSize.width = this.resizing.width + coreEvent.deltaX;
            }
          }
          if (!this.fixedHeight) {
            newSize.height = this.resizing.height + coreEvent.deltaY;
          }
          this.resizing = newSize;
          break;
        }

        case "resizeend": {
          pos = this.calcPosition(
            this.innerX,
            this.innerY,
            this.innerW,
            this.innerH,
          );

          let resizeWidth = pos.width;
          if (!this.fixedWidth) {
            const colWidth = this.calcColWidth();
            const currentW = this.calcWH(pos.height, pos.width).w;
            let resizeW = Math.ceil(currentW / this.minW) * this.minW;
            resizeWidth = Math.round(
              colWidth * resizeW + Math.max(0, resizeW - 1) * this.margin[0],
            );
          }

          let newSizeH = pos.height;
          if (this.aspectRatio !== -1) {
            newSizeH =
              this.calcWH(pos.height, resizeWidth).w *
              this.aspectRatio *
              this.rowHeight;
          }

          newSize.width = resizeWidth;
          newSize.height = newSizeH;
          newSize.left = pos.left;
          newSize.top = pos.top;
          this.resizing = null;
          this.isResizing = false;
          this.startSize = null;
          break;
        }
      } // swicth
      pos = this.calcWH(newSize.height, newSize.width);
      if (pos.w < this.minW) {
        pos.w = this.minW;
      }

      if (pos.w > this.maxW) {
        pos.w = this.maxW;
      }

      if (pos.h < this.minH) {
        pos.h = this.minH;
      }

      if (pos.h > this.maxH) {
        pos.h = this.maxH;
      }

      if (pos.h < 1) {
        pos.h = 1;
      }
      if (pos.w < 1) {
        pos.w = 1;
      }

      this.lastW = x;
      this.lastH = y;
      if (this.innerW !== pos.w || this.innerH !== pos.h) {
        this.$emit(
          "resize",
          this.i,
          pos.h,
          pos.w,
          newSize.height,
          newSize.width,
          newSize.left,
          newSize.top,
        );
      }

      if (
        event.type === "resizeend" &&
        (this.previousW !== this.innerW || this.previousH !== this.innerH)
      ) {
        this.$emit(
          "resized",
          this.i,
          pos.h,
          pos.w,
          newSize.height,
          newSize.width,
          newSize.left,
          newSize.top,
        );
        this.eventBus.$emit(
          "resizeEvent",
          event.type,
          this.i,
          this.innerX,
          this.innerY,
          pos.h,
          pos.w,
        );
      }
    }, // 方法结束

    handleDrag(event) {
      if (this.static) return;
      if (this.isResizing) return;
      if (this.expanded) return;
      const position = getControlPosition(event);
      if (position === null) return;
      let { x, y } = position;
      x = x / this.scaleRatio;
      y = y / this.scaleRatio;

      let newPosition = { top: 0, left: 0 };
      switch (event.type) {
        case "dragstart": {
          this.previousX = this.innerX;
          this.previousY = this.innerY;
          let parentRect = event.target.offsetParent.getBoundingClientRect();
          let clientRect = event.target.getBoundingClientRect();
          if (this.renderRtl) {
            newPosition.left =
              ((clientRect.right - parentRect.right) * -1) / this.scaleRatio;
          } else {
            newPosition.left =
              (clientRect.left - parentRect.left) / this.scaleRatio;
          }
          newPosition.top = (clientRect.top - parentRect.top) / this.scaleRatio;
          this.dragging = newPosition;
          this.isDragging = true;
          break;
        }

        case "dragend": {
          if (!this.isDragging) return;
          let parentRect = event.target.offsetParent.getBoundingClientRect();
          let clientRect = event.target.getBoundingClientRect();
          if (this.renderRtl) {
            newPosition.left =
              ((clientRect.right - parentRect.right) * -1) / this.scaleRatio;
          } else {
            newPosition.left =
              (clientRect.left - parentRect.left) / this.scaleRatio;
            const colWidth = this.calcColWidth();
            let newX = Math.round(
              (newPosition.left - this.margin[0]) / (colWidth + this.margin[0]),
            );

            let x = Math.floor(newX / this.minW) * this.minW;

            newPosition.left = x * (colWidth + this.margin[0]) + this.margin[0];
          }
          newPosition.top = (clientRect.top - parentRect.top) / this.scaleRatio;
          this.dragging = null;
          this.isDragging = false;
          break;
        }

        case "dragmove": {
          const coreEvent = createCoreData(this.lastX, this.lastY, x, y)
          if (this.renderRtl) {
            newPosition.left = this.dragging.left - coreEvent.deltaX;
          } else {
            newPosition.left = this.dragging.left + coreEvent.deltaX;
          }
          newPosition.top = this.dragging.top + coreEvent.deltaY;
          this.dragging = newPosition;
          break;
        }
      } //switch

      let pos;
      if (this.renderRtl) {
        pos = this.calcXY(newPosition.top, newPosition.left);
      } else {
        pos = this.calcXY(newPosition.top, newPosition.left);
      }
      let newSize = this.calcPosition(
        this.innerX,
        this.innerY,
        this.innerW,
        this.innerH,
      );
      this.lastX = x;
      this.lastY = y;
      if (this.innerX !== pos.x || this.innerY !== pos.y) {
        this.$emit(
          "move",
          this.i,
          pos.x,
          pos.y,
          newSize.height,
          newSize.width,
          newSize.left,
          newSize.top,
        );
      }

      if (
        event.type === "dragend" &&
        (this.previousX !== this.innerX || this.previousY !== this.innerY)
      ) {
        this.$emit(
          "moved",
          this.i,
          pos.x,
          pos.y,
          newSize.height,
          newSize.width,
          newSize.left,
          newSize.top,
        );
      }

      this.eventBus.$emit(
        "dragEvent",
        event.type,
        this.i,
        pos.x,
        pos.y,
        this.innerH,
        this.innerW,
      );
    }, //方法结束

    calcPosition: function (x, y, w, h) {
      const colWidth = this.calcColWidth();
      let out;
      if (this.renderRtl) {
        out = {
          right: Math.round(colWidth * x + (x + 1) * this.margin[0]),
          top:
            Math.round(this.rowHeight * y + (y + 1) * this.margin[1]) +
            this.above,
          width:
            w === Infinity
              ? w
              : Math.round((colWidth * w + Math.max(0, w - 1)) * this.margin[0]),
          height:
            h === Infinity
              ? h
              : Math.round(
                  this.rowHeight * h + Math.max(0, h - 1) * this.margin[1],
                ),
        };
      } else {
        out = {
          left: Math.round(colWidth * x + (x + 1) * this.margin[0]),
          top:
            Math.round(this.rowHeight * y + (y + 1) * this.margin[1]) +
            this.above,
          width:
            w === Infinity
              ? w
              : Math.round(colWidth * w + Math.max(0, w - 1) * this.margin[0]),
          height:
            h === Infinity
              ? h
              : Math.round(
                  this.rowHeight * h + Math.max(0, h - 1) * this.margin[1],
                ),
        };
      }
      return out;
    },

    calcXY(top, left) {
      const colWidth = this.calcColWidth();
      let x = Math.round((left - this.margin[0]) / (colWidth + this.margin[0]));
      let y = Math.round(
        (top - this.margin[1]) / (this.rowHeight + this.margin[1]),
      );

      x = Math.max(Math.min(x, this.cols - this.innerW), 0);
      y = Math.max(Math.min(y, this.maxRows - this.innerH), 0);
      return { x, y };
    },

    calcColWidth() {
      const colWidth =
        (this.containerWidth - this.margin[0] * (this.cols + 1)) / this.cols;
      return colWidth;
    },

    calcWH(height, width) {
      const colWidth = this.calcColWidth();
      let w = Math.round(
        (width + this.margin[0]) / (colWidth + this.margin[0]),
      );

      let h = Math.round(
        (height + this.margin[1]) / (this.rowHeight + this.margin[1]),
      );

      w = Math.max(Math.min(w, this.cols - this.innerX), 0);

      h = Math.max(Math.min(h, this.maxRows - this.innerY), 0);
      return { w, h };
    },

    updateWidth: function (width, colNum) {
      this.containerWidth = width;
      if (colNum !== undefined && colNum !== null) {
        this.cols = colNum;
      }
    },
    compact: function () {
      this.createStyle();
    },

    tryMakeDraggable: function () {
      if (this.isView) return;
      const self = this;
      if (this.interactObj === null || this.interactObj === undefined) {
        this.interactObj = interact(this.$refs.item);
        if (!this.useStyleCursor) {
          this.interactObj.styleCursor(false);
        }
      }

      if (this.draggable && !this.static) {
        const opts = {
          ignoreFrom: this.dragIgnoreFrom,
          allowFrom: this.dragAllowFrom,
        };

        this.interactObj.draggable(opts);
        this.interactObj.draggable({ allowFrom: ".vue-draggable-handle" });

        if (!this.dragEventSet) {
          this.dragEventSet = true;
          this.interactObj.on("dragstart dragmove dragend", function (event) {
            self.handleDrag(event);
            self.click = false;
          });
        } else {
          this.interactObj.draggable({ enabled: false });
        }
      }
    },

    tryMakeResizable: function () {
      const self = this;
      if (this.interactObj === null || this.interactObj === undefined) {
        this.interactObj = interact(this.$refs.item);
        if (!this.useStyleCursor) {
          this.interactObj.styleCursor(false);
        }
      }
      if (this.resizable && !this.static) {
        let maximum = this.calcPosition(0, 0, this.maxW, this.maxH);
        let minimum = this.calcPosition(0, 0, this.minW, this.minH);
        const opts = {
          preserveAspectRatio: true,
          edges: {
            left: false,
            right: "." + this.resizableHandleClass.trim().replace(" ", "."),
            bottom: "." + this.resizableHandleClass.trim().replace(" ", "."),
            top: false,
          },
          ignoreFrom: this.resizeIgnoreFrom,
          restrictSize: {
            min: {
              height: minimum.height,
              width: minimum.width,
            },
            max: {
              height: maximum.height,
              width: maximum.width,
            },
          },
        };
        this.interactObj.resizable(opts);
        if (!this.resizeEventSet) {
          this.resizeEventSet = true;
          this.interactObj.on(
            "resizestart resizemove resizeend",
            function (event) {
              self.click = false;
              self.handleResize(event);
            },
          );
        }
      } else {
        this.interactObj.resizable({ enabled: false });
      }
    }, //
    autoSize: function () {
      this.previousW = this.innerW;
      this.previousH = this.innerH;
      let newSize = this.$slots.default[0].elm.getBoundingClientRect();
      let pos = this.calcWH(newSize.height, newSize.width);

      if (pos.w < this.minW) {
        pos.w = this.minW;
      }

      if (pos.w > this.maxW) {
        pos.w = this.maxW;
      }

      if (pos.h < this.minH) {
        pos.h = this.minH;
      }

      if (pos.h > this.maxH) {
        pos.h = this.maxH;
      }

      if (pos.h < 1) {
        pos.h = 1;
      }
      if (pos.w < 1) {
        pos.w = 1;
      }

      if (this.innerW !== pos.w || this.innerH !== pos.h) {
        this.$emit(
          "resize",
          this.i,
          pos.h,
          pos.w,
          newSize.height,
          newSize.width,
        );
      }
      if (this.previousW !== pos.w || this.previousH !== pos.h) {
        this.$emit(
          "resized",
          this.i,
          pos.h,
          pos.w,
          newSize.height,
          newSize.width,
        );
        this.eventBus.$emit(
          "resizeEvent",
          "resizeend",
          this.i,
          this.innerX,
          this.innerY,
          pos.h,
          pos.w,
        );
      }
    }, //

    handleltemDoubleClick(i) {
      if (!this.isGroup) this.$emit("doubleClick", i);
    },
    onOpt(name) {
      name === "1" && this.updateWidget();
      name === "2" && this.clickitem();
      name === "3" && this.deleteItem();
      name === "4" && this.handleltemDoubleClick(this.i);
    },
  },
};
</script>
