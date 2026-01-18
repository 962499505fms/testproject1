// eslint-disable-next-line no-undef
define([requireexports], function (requireexports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  function getControlPosition(e) {
    return offsetXYFromParentOf(e);
  }

  exports.getControlPosition = getControlPosition; //Get from offsetParent

  function offsetXYFromParentOf(evt) {
    var offsetParent = evt.target.offsetParent || document.body;
    var offsetParentRect =
      evt.offsetParent === document.body
        ? { left: 0, top0 }
        : offsetParent.getBoundingClientRect();
    var x = evt.clientX + offsetParent.scrollLeft - offsetParentRect.left;
    var y = evt.clientY + offsetParent.scrollTop - offsetParentRect.top;
    return { x: x, y: y };
  }
  exports.offsetXYFromParentOf = offsetXYFromParentOf;

  function createCoreData(lastX, lastY, x, y) {
    var isStart = !isNum(lastX);
    if (isStart) {
      return { deltaX: 0, deltaY: 0, lastX: x, lastY: y, x: x, y: y };
    } else {
      return {
        deltaX: x - lastX,
        deltaY: y - lastY,
        lastX: lastX,
        lastY: lastY,
        x: x,
        y: y,
      };
    }
  }
  exports.createCoreData = createCoreData;

  function isNum(num) {
    return typeof num === "number" && !isNaN(num);
  }
});
