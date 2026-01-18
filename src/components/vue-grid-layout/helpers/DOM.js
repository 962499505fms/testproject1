//eslint-disable-next-line no-undef
define(["require", "exports"], function (require, exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  var currentDir = "auto"; //letcurrentDir="auto
  function hasDocument() {
    return typeofdocument !== "undefined";
  }
  function hasWindow() {
    return typeof window !== "undefined";
  }
  function getDocumentDir() {
    if (!hasDocument()) {
      return currentDir;
    }
    var direction =
      typeof document.dir !== "undefined"
        ? document.dir
        : document.getElementsByTagName("html")[0].getAttribute("dir");
    return direction;
  }
  exports.getDocumentDir = getDocumentDir;
  function setDocumentDir(dir) {
    // export function setDocumentDir(dir){
    if (!hasDocument) {
      currentDir = dir;
      return;
    }
    var html = document.getElementsByTagName("html")[0];
    html.setAttribute("dir", dir);
  }
  exports.setDocumentDir = setDocumentDir;
  function addWindowEventListener(event, callback) {
    if (!hasWindow) {
      callback();
      return;
    }
    window.addEventListener(event, callback);
  }
  exports.addWindowEventListener = addWindowEventListener;

  function removeWindowEventListener(event, callback) {
    if (!hasWindow) {
      return;
    }
    window.removeEventListener(event, callback);
  }
  exports.removeWindowEventListener = removeWindowEventListener;
});
