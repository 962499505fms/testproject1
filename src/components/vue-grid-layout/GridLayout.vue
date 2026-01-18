<template>
  <div ref="item" class="vue-grid-layout" :style="mergedstyle">
    <slot></slot>
    <grid-item
      class="vue-grid-placeholder"
      v-show="isDragging"
      :x="placeholder.x"
      :y="placeholder.y"
      :w="placeholder.w"
      :h="placeholder.h"
      :scale-ratio="scaleRatio"
      :above="above"
      :i="placeholder.i"
      :show-handle="false"
      dragAllowFrom=".vue-draggable-handle"
      dragIgnoreFrom=".no-drag"
    >
    </grid-item>
  </div>
</template>
<style>
.vue-grid-layout {
  position: relative;
  transition: height 200ms ease;
}
</style>
<script>
import Vue from "vue";
const elementResizeDetectorMaker = require("element-resize-detector");

import {
  bottom,
  compact,
  getLayoutItem,
  moveElement,
  resizeElement,
  validateLayout,
  cloneLayout,
  getAllCollisions,
  findNearestGroup,
} from "./helpers/utils";

import {
  getBreakpointFromwidth,
  getColsFromBreakpoint,
  findOrGenerateResponsiveLayout,
} from "./helpers/responsiveutils";

import GridItem from "./GridItem.vue";
import {
  addwindowEventListener,
  removewindowEventListener,
} from "./helpers/DOM";

export default {
  name: "GridLayout",
  provide() {
    return {
      eventBus: null,
      layout: this,
    };
  },
  components: {
    GridItem,
  },
  props: {
    autoSize: { type: Boolean, default: true },
    colNum: { type: Number, default: 12 },
    above: { type: Number, default: 0 },
    rowHeight: { type: Number, default: 150 },
    maxRows: { type: Number, default: Infinity },
    margin: {
      type: Array,
      default: function () {
        return [10, 10];
      },
    },
    isDraggable: { type: Boolean, default: true },
    isResizable: { type: Boolean, default: true },
    isMirrored: { type: Boolean, default: false },
    useCssTransforms: { type: Boolean, default: true },
    verticalCompact: { type: Boolean, default: true },
    layout: { type: Array, required: true },
    responsive: { type: Boolean, default: false },
    responsiveLayouts: {
      type: Object,
      default: function () {
        return {};
      },
    },
    breakpoints: {
      type: Object,
      default: function () {
        return { lg: 1600, md: 996, sm: 768, xs: 480, xxs: 0 };
      },
    },
    cols: {
      type: Object,
      default: function () {
        return { lg: 12, md: 8, sm: 8, xs: 8, xxs: 4 };
      },
    },
    preventcollision: { type: Boolean, default: false },
    usestyleCursor: { type: Boolean, default: true },
    scaleRatio: { type: Number, default: 1 },
    allGroupIds: {
      type: Array,
      default: function () {
        return [];
      },
    },
  },
  data: function () {
    return {
      width: null,
      mergedstyle: {},
      lastLayoutLength: 0,
      isDragging: false,
      placeholder: {
        X: 0,
        y: 0,
        W: 0,
        h: 0,
        i: -1,
      },
      layouts: {}, // array to store all layouts from different breakpoints
      lastBreakpoint: null, // store last active breakpoint
      originalLayout : null, // store original Layout
    };
  },

  created() {
    const self = this;
    // Accessible refernces of functions for removing in beforeDestroy
    self.resizeEventHandler = function (eventType, i, x, Y, h, w) {
      self.resizeEvent(eventType, i, x, y, h, w);
    };
    self.dragEventHandler = function (eventType, i, x, y, h, w) {
      self.dragEvent(eventType, i, x, y, h, w);
    };

    self._provided.eventBus = new Vue();
    self.eventBus = self._provided.eventBus;
    self.eventBus.$on("resizeEvent", self.resizeEventHandler);
    self.eventBus.$on("dragEvent", self.dragEventHandler);
    self.$emit("layout-created", self.layout);
  },
  beforeDestroy: function () {
    this.eventBus.$off("resizeEvent", this.resizeEventHandler);
    this.eventBus.$off("dragEvent", this.dragEventHandler);
    this.eventBus.$destroy();
    removewindowEventListener("resize", this.onWindowResize);
    this.erd.uninstall(this.$refs.item);
  },
  beforeMount: function () {
    this.$emit("layout-before-mount", this.layout);
  },
  mounted() {
    this.$emit("layout-mounted", this.layout);
    this.$nextTick(function () {
      validateLayout(this.layout);
      this.originalLayout  = this.layout;
      const self = this;
      this.$nextTick(function () {
        self.onWindowResize();
        self.initResponsiveFeatures();

        //self.width = self.$el.offsetWidth:
        addWindowEventListener("resize", self.onWindowResize);
        compact(self.layout, self.verticalcompact);

        self.$emit("layout-updated", self.layout);

        self.updateHeight();

        self.$nextTick(function () {
          this.erd = elementResizeDetectorMaker({
            strategy: "scroll",
            callonAdd: false,
          });
          this.erd.listenTo(self.$refs.item, function () {
            self.onWindowResize();
          });
        });
      });
    });
  },

  watch: {
    width: function (newval, oldval) {
      const self = this;
      this.$nextTick(function () {
        this.eventBus.$emit("updateWidth", this.width);

        if (oldval === null) {
          this.$nextTick(() => {
            this.$emit("layout-ready", self.layout);
          });
        }

        this.updateHeight();
      });
    },
    layout() {
      this.layoutUpdate();
    },
    colNum: function (val) {
      this.eventBus.$emit("setColNum", val);
    },
    rowHeight: function () {
      this.eventBus.$emit("setRowHeight", this.rowHeight);
    },
    isDraggable: function () {
      this.eventBus.$emit("setDraggable", this.isDraggable);
    },
    isResizable: function () {
      this.eventBus.$emit("setResizable", this.isResizable);
    },
    responsive() {
      if (!this.responsive) {
        this.$emit("update:layout", this.originalLayout);
        this.$emit("update-layout", this.originalLayout);
        this.eventBus.$emit("setColNum", this.colNum);
      }
      this.onWindowResize();
    },
    maxRows: function () {
      this.eventBus.$emit("setMaxRows", this.maxRows);
    },
    margin() {
      this.updateHeight();
    },
  },
  computed: {
    isview() {
      const view = this.$utils.geturlParams("mode");
      return Boolean(view === "view" || !view);
    },
  },
  methods: {
    layoutUpdate() {
      if (this.layout !== undefined && this.originalLayout  !== null) {
        if (this.layout.length !== this.originalLayout .length) {
          let diff = this.findDifference(this.layout, this.originalLayout );
          if (diff.length > 0) {
            if (this.layout.length > this.originalLayout.length) {
              this.originalLayout  = this.originalLayout .concat(diff);
            } else {
              this.originalLayout  = this.originalLayout.filter((obj) => {
                return !diff.some((obj2) => {
                  return obj.i === obj2.i;
                });
              });
            }
          }
          this.lastlayoutLength = this.layout.length;
          this.initResponsiveFeatures();
        }
        this.eventBus.$emit("updateWidth", this.width);
        this.updateHeight();
        this.$emit("layout-updated", this.layout);
      }
    },
    updateHeight: function () {
      this.mergedstyle = { height: this.containerHeight() };
    },
    onWindowResize: function () {
      if (
        this.$refs !== null &&
        this.$refs.item !== null &&
        this.$refs.item !== undefined
      ) {
        this.width = this.$refs.item.offsetWidth;
      }
      this.eventBus.$emit("resizeEvent");
    },

    containerHeight: function () {
      if (!this.autoSize) return;
      const containerHeight =
        bottom(this.layout) * (this.rowHeight + this.margin[1]) +
        this.margin[1] +
        "px";

      return containerHeight;
    },

    dragEvent: function (eventName, id, x, y, h, w) {
      let l = getlayoutItem(this.layout, id);
      if (this.isview || l.expanded) return;
      if (eventName === "dragstart") this.templayout = cloneLayout(this.layout);
      if (l === undefined || l === null) {
        l = { X: 0, y: 0 };
      }
      if (eventName === "dragmove" || eventName === "dragstart") {
        this.placeholder.i = id;
        this.placeholder.x = l.x;
        this.placeholder.y = l.y;
        this.placeholder.w = w;
        this.placeholder.h = h;
        this.$nextTick(function () {
          this.isDragging = true;
        });

        this.eventBus.$emit("updateWidth", this.width);
      } else {
        this.$nextTick(function () {
          this.isDragging = false;
        });
      }
      this.layout = moveElement(
        this.layout,
        l,
        x,
        y,
        true,
        this.preventCollision,
      );

      compact(this.layout, this.verticalcompact);
      this.eventBus.$emit("compact");
      this.updateHeight();
      if (eventName === "dragend") {
        let inotherGroup = this.isInGroupArea(l, this.layout);
        if (!inotherGroup) {
          this.handleGroupDrag(l, this.layout);
          this.$emit("layout-updated", this.layout); 
          this.$emit("layout-updated", this.templayout);
        }
      }
    },
    handleGroupDrag: function (l, layout) {
      if (!this.allGroupIds.includes(l.i)) {
        let oldParentId = l.groupId;
        let parent = findNearestGroup(layout, l.y, this.allGroupIds);

        if (parent && parent.expanded) {
          l.groupId = parent.i;
        } else {
          l.groupId = null;
        }
        // console.log("update-groupmap",l,layout)
        this.$emit("update-groupmap", l, oldParentId);
      }
    },
    isInGroupArea(l, layout) {
      let result = false;
      if (this.allGroupIds.includes(l.i)) {
        for (let i = 0; i < this.allGroupIds.length; i++) {
          let groupId = this.allGroupIds[i];
          let childs = layout.filter((layout) => layout.groupId === groupId);
          let yArr = childs.map((el) => el.y);
          let maxY = Math.max(...yArr);
          let group = layout.find((layout) => layout.i === groupId);
          result = l.y >= group.y && l.y <= maxY;
          if (result) break;
        }
      }
      // console.log(result,l)
      return result;
    },

    resizeEvent: function (eventName, id, x, y, h, w) {
      if (!id) return;
      let l = getlayoutItem(this.layout, id);
      if (l == undefined || l === null) {
        l = { h: 0, w: 0 };
      }

      let hasCollisions;
      if (this.preventcollision) {
        const collisions = getAllCollisions(this.layout, { ...l, w, h }).filter(
          (layoutItem) => layoutItem.i !== l.i,
        );
        hasCollisions = collisions.length > 0;
        if (hasCollisions) {
          let leastx = Infinity,
            leastY = Infinity;
          collisions.forEach((layoutItem) => {
            if (layoutItem.x > l.x) leastx = Math.min(leastx, layoutItem.x);
            if (layoutItem.y > l.y) leastY = Math.min(leastY, layoutItem.y);
          });
          if (Number.isFinite(leastx)) l.w = leastx - l.x;
          if (Number.isFinite(leastY)) l.h = leastY - l.y;
        }
      }

      if (!hasCollisions) {
        // Set new width and height
        ((l.w = w), (l.h = h));
      }

      if (eventName === "resizestart" || eventName === "resizemove") {
        this.placeholder.i = id;
        this.placeholder.x = x;
        this.placeholder.y = y;
        this.placeholder.w = l.w;
        this.placeholder.h = l.h;
        this.$nextTick(function () {
          this.isDragging = true;
        });
        this.eventBus.$emit("updateWidth", this.width);
      } else {
        this.$nextTick(function () {
          this.isDragging = false;
        });
      }

      if (this.responsive) this.responsiveGridLayout();
      resizeElement(this.layout, l, x, y, w, h, true, eventName);
      if (eventName === "resizeend") {
        compact(this.layout, this.verticalCompact, l);
      }
      this.eventBus.$emit("compact");
      this.updateHeight();
      if (eventName === "resizeend") this.$emit("layout-updated", this.layout);
    },

    responsiveGridLayout() {
      let newBreakpoint = getBreakpointFromWidth(this.breakpoints, this.width);
      let newCols = getColsFromBreakpoint(newBreakpoint, this.cols);
      if (this.lastBreakpoint != null && !this.layouts[this.lastBreakpoint])
        this.layouts[this.lastBreakpoint] = cloneLayout(this.layout);
      let layout = findorGenerateResponsiveLayout(
        this.originalLayout,
        this.layouts,
        this.breakpoints,
        newBreakpoint,
        this.lastBreakpoint,
        newCols,
        this.verticalcompact,
      );
      this.layouts[newBreakpoint] = layout;
      if (this.lastBreakpoint !== newBreakpoint) {
        this.$emit("breakpoint-changed", newBreakpoint, layout);
        this.$emit(
          "colnumchanged",
          this.cols[newBreakpoint],
          newBreakpoint,
          layout,
        );
      }
      if (!this.responsive) {
        this.$emit("update:layout", layout);
        this.$emit("update-layout", layout);
      }
      this.layout = layout;
      this.lastBreakpoint = newBreakpoint;

      this.eventBus.$emit(
        "setColNum",
        getColsFromBreakpoint(newBreakpoint, this.cols),
      );
    },
    initResponsiveFeatures() {
      this.layouts = Object.assign({}, this.responsivelayouts);
    },
    findDifference(layout, originalLayout ) {
      let uniqueResultone = layout.filter(function (obj) {
        return !originalLayout .some(function (obj2) {
          return obj.i === obj2.i;
        });
      });
      let uniqueResultTwo = originalLayout .filter(function (obj) {
        return !layout.some(function (obj2) {
          return obj.i === obj2.i;
        });
      });

      return uniqueResultone.concat(uniqueResultTwo);
    },
  },
};
</script>
