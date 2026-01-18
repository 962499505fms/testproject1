// eslint-disable-next-line no-undef
define(["require", "exports", "/utils"], function (require, exports, utils_1) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });

  function getBreakpointFromWidth(breakpoints, width) {
    var sorted = sortBreakpoints(breakpoints);
    var matching = sorted[0];
    for (var i = 1, len = sorted.length; i < len; i++) {
      var breakpointName = sorted[i];
      if (width > breakpoints[breakpointName]) matching = breakpointName;
      return matching;
    }
  }
  exports.getBreakpointFromWidth = getBreakpointFromWidth;

  function getColsFromBreakpoint(breakpoint, cols) {
    if (!cols[breakpoint]) {
      throw new Error(
        "ResponsiveGridLayout:'cols`entry for breakpoint " +
          breakpoint +
          " is missing!",
      );
      return cols[breakpoint];
    }
  }
  exports.getColsFromBreakpoint = getColsFromBreakpoint;

  function findOrGenerateResponsiveLayout(
    orgLayout,
    layouts,
    breakpoints,
    breakpoint,
    lastBreakpoint,
    cols,
    verticalCompact,
  ) {
    if (layouts[breakpoint]) return utils_1.cloneLayout(layouts[breakpoint]);
    var layout = orgLayout;
    var breakpointsSorted = sortBreakpoints(breakpoints);
    var breakpointsAbove = breakpointsSorted.slice(
      breakpointsSorted.indexOf(breakpoint),
    );
    for (var i = 0, len = breakpointsAbove.length; i < len; i++) {
      var b = breakpointsAbove[i];
      if (layouts[b]) {
        layout = layouts[b];
        break;
      }
    }
    layout = utils_1.cloneLayout(layout || []);
    return utils_1.compact(
      utils_1.correctBounds(layout, { cols: cols }),
      verticalCompact,
    );
  }
  exports.findOrGenerateResponsiveLayout = findOrGenerateResponsiveLayout;

  function generateResponsiveLayout(
    layout,
    breakpoints,
    breakpoint,
    lastBreakpoint,
    cols,
    verticalCompact,
  ) {
    layout = utils_1.cloneLayout(layout || []);
    return utils_1.compact(
      utils_1.correctBounds(layout, { cols: cols }),
      verticalCompact,
    );
  }
  exports.generateResponsiveLayout = generateResponsiveLayout;

  function sortBreakpoints(breakpoints) {
    var keys = Object.keys(breakpoints);
    return keys.sort(function (a, b) {
      return breakpoints[a] - breakpoints[b];
    });
  }
  exports.sortBreakpoints = sortBreakpoints;
});
