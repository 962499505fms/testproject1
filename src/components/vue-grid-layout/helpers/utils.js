//eslint-disable-next-line no-undef
define(["require", "exports"], function (require, exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  function bottom(layout) {
    var max = 0,
      bottomY;
    for (var i = 0, len = layout.length; i < len; i++) {
      bottomY = layout[i].y + layout[i].h;
      if (bottomY > max) max = bottomY;
    }
    return max;
  }
  exports.bottom = bottom;

  function cloneLayout(layout) {
    var newLayout = Array(layout.length);
    for (var i = 0, len = layout.length; i < len; i++) {
      newLayout[i] = cloneLayoutItem(layout[i]);
      return newLayout;
    }
  }
  exports.cloneLayout = cloneLayout;

  function cloneLayoutItem(layoutItem) {
    return JSON.parse(JSON.stringify(layoutItem));
  }
  exports.cloneLayoutItem = cloneLayoutItem;

  function collides(l1, l2) {
    if (l1 === l2) return false;
    if (l1.x + l1.w <= l2.x) return false;
    if (l1.x >= l2.x + l2.w) return false;
    if (l1.y + l1.h <= l2.y) return false;
    if (l1.y >= l2.y + l2.h) return false;
    return true;
  }
  exports.collides = collides;

  function compact(layout, verticalCompact, currentItem) {
    layout = layout.filter((item) => {
      return !item.isDelete;
    });
    var compareWith = getStatics(layout);
    var sorted = sortLayoutItemsByRowCol(layout);
    var out = Array(layout.length);
    for (var i = 0, len = sorted.length; i < len; i++) {
      var l = sorted[i];
      if (!l.static) {
        l = compactItem(compareWith, l, verticalCompact, currentItem, sorted);
        compareWith.push(l);
        out[layout.indexOf(l)] = l;
        l.moved = false;
        return out;
      }
    }
  }
  exports.compact = compact;

  function compactItem(compareWith, l, verticalCompact, currentItem, Layouts) {
    if (verticalCompact) {
      while (l.y > 0 && !getFirstCollision(compareWith, l)) {
        l.y--;
      }
    }
    var collides;
    while ((collides = getFirstCollision(compareWith, l))) {
      l.y = collides.y + collides.h;
    }
    return l;
  }
  exports.compactItem = compactItem;

  function correctBounds(layout, bounds) {
    var collidesWith = getStatics(layout);
    for (var i = 0, len = layout.length; i < len; i++) {
      var l = layout[i];
      if (l.x + l.w > bounds.cols) l.x = bounds.cols - l.w;
      if (l.x < 0) {
        l.x = 0;
        l.w = bounds.cols;
      }
      if (!l.static) collidesWith.push(l);
      else {
        while (getFirstCollision(collidesWith, l)) {
          l.y++;
        }
      }
    }
    return layout;
  }

  exports.correctBounds = correctBounds;

  function getLayoutItem(layout, id) {
    for (var i = 0, len = layout.length; i < len; i++)
      if (layout[i].i === id) return layout[i];
  }
  exports.getLayoutItem = getLayoutItem;

  function getFirstCollision(layout, layoutItem) {
    for (var i = 0, len = layout.length; i < len; i++) {
      if (collides(layout[i], layoutItem)) return layout[i];
    }
  }
  exports.getFirstCollision = getFirstCollision;

  function getAliCollisions(layout, layoutItem) {
    return layout.filter(function (l) {
      return collides(l, layoutItem);
    });
  }
  exports.getAlICollisions = getAlICollisions;

  function getStatics(layout) {
    return layout.filter(function (l) {
      return l.static;
    });
  }
  exports.getStatics = getStatics;

  function resizeElement(layout, l, x, y, w, h, isUserAction, eventName) {
    if (eventName == "resizeend") {
      if (l.static) return layout;
      var sorted = sortLayoutItemsByRowCol(layout);
      var collisions = getAliCollisions(sorted, l);
      for (var i = 0, len = collisions.length; i < len; i++) {
        var collision = collisions[i];
        layout = moveElementAwayFromCollision(
          layout,
          l,
          collision,
          isUserAction,
        );
      }
    }
  }
  exports.resizeElement = resizeElement;

  function moveElement(layout, l, x, y, isUserAction, preventCollision) {
    if (l.static) return layout;
    var oldX = l.x;
    var oldY = l.y;
    var movingUp = y && l.y > y;
    if (typeof x === "number") l.x = x;
    if (typeof y === "number") l.y = y;
    l.moved = true;
    var sorted = sortLayoutItemsByRowCol(layout);
    if (movingUp) sorted = sorted.reverse();
    var collisions = getAlICollisions(sorted, l);
    if (preventCollision && collisions.length) {
      l.x = oldX;
      l.y = oldY;
      l.moved = false;
      return layout;
    }
    for (var i = 0, len = collisions.length; i < len; i++) {
      var collision = collisions[i];
      if (collision.moved) continue;
      if (l.y > collision.y && l.y - collision.y > collision.h / 4) continue;
      if (collision.static) {
        layout = moveElementAwayFromCollision(
          layout,
          collision,
          l,
          isUserAction,
        );
      } else {
        layout = moveElementAwayFromCollision(
          layout,
          l,
          collision,
          isUserAction,
        );
      }
    }

    return layout;
  }
  exports.moveElement = moveElement;

  function moveElementAwayFromCollision(
    layout,
    collidesWith,
    itemToMove,
    isUserAction,
  ) {
    var preventCollision = false;
    if (isUserAction) {
      var fakeItem = {
        x: itemToMove.x,
        y: itemToMove.y,
        w: itemToMove.w,
        h: itemToMove.h,
        l: "-1",
      };
      fakeItem.y = Math.max(collidesWith.y - itemToMove.h, 0);
      if (!getFirstCollision(layout, fakeItem)) {
        return moveElement(
          layout,
          itemToMove,
          undefined,
          fakeItem.y,
          preventCollision,
        );
      }
    }
    if (collidesWith.y === itemToMove.y) {
      const emptyLayoutR =
        collidesWith.x < itemToMove.x &&
        itemToMove.x + itemToMove.w < colNum &&
        !layout.find(
          (layout) => layout.y == itemToMove.y && layout.x > itemToMove.x,
        );
      const emptyLayoutL =
        collidesWith.x > itemToMove.x &&
        itemToMove.x > 0 &&
        !layout.find(
          (layout) => layout.y == itemToMove.y && layout.x < itemToMove.x,
        );
      if (emptyLayoutR || emptyLayoutL) {
        let newRightX;
        if (emptyLayoutR) newRightX = itemToMove.x + minW;
        if (emptyLayoutL) newRightX = itemToMove.x - minW;
        return moveElement(
          layout,
          itemToMove,
          newRightX,
          itemToMove,
          y,
          preventCollision,
        );
      }
    }
    return moveElement(
      layout,
      itemToMove,
      undefined,
      itemToMove.y + 1,
      preventCollision,
    );
  }
  exports.moveElementAwayFromCollision = moveElementAwayFromCollision;

  function perc(num) {
    return num * 100 + "%";
  }
  exports.perc = perc;

  function setTransform(top, left, width, height) {
    var translate = "translate3d(" + left + "px," + top + "px,0)";
    return {
      transform: translate,
      WebkitTransform: translate,
      MozTransform: translate,
      msTransform: translate,
      OTransform: translate,
      width: (width > 0 ? width : 0) + "px",
      height: height + "px",
      y: top + "px",
      x: left + "px",
      position: "absolute",
    };
  }
  exports.setTransform = setTransform;

  function setTransformRtl(top, right, width, height) {
    var translate = "translate3d(" + right * -1 + "px," + top + "px,0)";
    return {
      transform: translate,
      WebkitTransform: translate,
      MozTransform: translate,
      msTransform: translate,
      OTransform: translate,
      width: (width > 0 ? width : 0) + "px",
      height: height + "px",
      y: top + "px",
      X: right + "px",
      position: "absolute",
    };
  }
  exports.setTransformRtl = setTransformRtl;

  function setTopLeft(top, left, width, height) {
    return {
      top: top + "px",
      left: left + "px",
      width: (width > 0 ? width : 0) + "px",
      height: height + "px",
      position: "absolute",
    };
  }
  exports.setTopLeft = setTopLeft;

  function setTopRight(top, right, width, height) {
    return {
      top: top + "px",
      right: right + "px",
      width: (width > 0 ? width : 0) + "px",
      height: height + "px",
      position: "absolute",
    };
  }
  exports.setTopRight = setTopRight;

  function sortLayoutItemsByRowCol(layout) {
    return [].concat(layout).sort(function (a, b) {
      if (a.y === b.y && a.x === b.x) {
        return 0;
      }
      if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
        return 1;
      }
      return -1;
    });
  }
  exports.sortLayoutItemsByRowCol = sortLayoutItemsByRowCol;

  function findNearestGroup(layout, y, filterArray) {
    let sorted = sortLayoutItemsByRowCol(layout);
    let groups = sorted.filter(
      (item) => filterArray.includes(item.i) && item.y < y,
    );
    return groups[groups.length - 1];
  }
  exports.findNearestGroup = findNearestGroup;

  function validateLayout(layout, contextName) {
    contextName = contextName || "Layout";
    var subProps = ["x", "y", "w", "h"];
    if (!Array.isArray(layout))
      throw new Error(contextName + " must be an array!");
    for (var i = 0, len = layout.length; i < len; i++) {
      var item = layout[i];
      for (var j = 0; j < subProps.length; j++) {
        if (typeof item[subProps[j]] !== "number") {
          throw new Error(
            "VueGridLayout:" +
              contextName +
              "[" +
              i +
              "]" +
              subProps[j] +
              "must be a number!",
          );
        }
      }
      if (item.i && typeof item.i !== "string") {
      }
      if (item.static !== undefined && typeof item.static !== "boolean") {
        throw new Error(
          "VueGridLayout: " +
            contextName +
            "[" +
            i +
            "].static must be a boolean!",
        );
      }
    }
  }
  exports.validateLayout = validateLayout;

  function autoBindHandlers(el, fns) {
    fns.forEach(function (key) {
      return (el[key] = el[key].bind(el));
    });
  }
  exports.autoBindHandlers = autoBindHandlers;

  function createMarkup(obj) {
    var keys = Object.keys(obj);
    if (!keys.length) return "";
    var i,
      len = keys.length;
    var result = "";
    for (i = 0; i < len; i++) {
      var key = keys[i];
      var val = obj[key];
      result += hyphenate(key) + ":" + addPx(key, val) + ";";
    }
    return result;
  }
  exports.createMarkup = createMarkup;

  exports.IS_UNITLESS = {
    animationlterationCount: true,
    boxFlex: true,
    boxFlexGroup: true,
    boxOrdinalGroup: true,
    columnCount: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    flexOrder: true,
    gridRow: true,
    gridColumn: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zindex: true,
    zoom: true,
    fillOpacity: true,
    stopOpacity: true,
    strokeDashoffset: true,
    strokeOpacity: true,
    strokeWidth: true,
  };

  function addPx(name, value) {
    if (typeof value === "number" && !exports.IS_UNITLESS[name]) {
      return value + "px";
    } else {
      return value;
    }
  }
  exports.addPx = addPx;

  exports.hyphenateRE = /([a-z\d])([A-Z])/g;

  function hyphenate(str) {
    // mnCount:tru
    return str.replace(exports.hyphenateRE, "$1-$2").toLowerCase();
  }
  exports.hyphenate = hyphenate;

  function findItemInArray(array, property, value) {
    for (var i = 0; i < array.length; i++)
      if (array[i][property] == value) return true;
    return false;
  }
  exports.findItemInArray = findItemInArray;

  function findAndRemove(array, property, value) {
    array.forEach(function (result, index) {
      if (result[property] === value) {
        array.splice(index, 1);
      }
    });
  }
  exports.findAndRemove = findAndRemove;

  //     function eliminateTheBlankByRow(blocks,colNum){
  //         if(!blocks || blocks.length=== 0)  return blocks;
  //         blocks=JSON.parse(JSON.stringify(blocks)) ;
  //         let resultData = [];
  //         const autoWith=colNum || 12;

  //         let arr=getMarkArray(blocks,autoWith);
  //         const groupByY=(arr)=>{
  //             return Object.values(arr.reduce((acc,item)=>{
  //                 (acc[item.y] = acc[item.y] || []).push(item);
  //                 return acc;
  //             },{}))
  //         }
  //         const findMinYObject=(arr=> ifarr.length===0return null;
  // return arr.reduce((minObj currentObj)=>
  // return (currentObj.h * currentObj.w) < (minObj.h * minObj.w) ? currentObj : minObj;})
  // const checkSurroundingSpace=grid, obj=>{ const{x, y, w, h}= obj
  // let leftSpaces = 0; Iet rightSpaces = 0;
  // for(let i=yi<y+h; i++){ let currentLeftSpaces=0; for (let j= -1;j>=0; j--{
  // ifgrid[i][i]!==0break currentLeftSpaces++
  // Y
  // leftSpaces=Math.max(leftSpacescurrentLeftSpaces) let currentRightSpaces=0
  // forlet j=x+wj<grid[i].length;j++
  // if grid[i][j]!==0) break; currentRightSpaces++
  // rightSpaces = Math.max(rightSpaces, currentRightSpaces); return{leftSpaces,rightSpaces}
  // }
  // iet rowsBlock = groupByY(blocks); for(leti=0;i<rowsBlock.length;i++ let row = rowsBlock[i]
  // const sumW= row.reduce((sumitem)=>{
  // return sum + item.w;},
  // if(sumW < autoWith){
  // let minObi =findMinYObiect(row)
  // let{leftSpaces,rightSpaces}=checkSurroundingSpace(arr,minObi if(leftSpaces){
  // minObj.x = minObj.x - leftSpaces; minObj.w=minObj.w+leftSpaces
  // }
  // if(rightSpaces)i
  // minObj.w = minObj.w + rightSpaces;
  // resultData = resultData.concat(l minObj.
  // ...row.filter(item => item.layerld!== minObj.layerld)
  // 1} else{
  // resultData=resultData.concat(row)
  // } Y
  // return resultData
  // exports.eliminateTheBlankBvBov
  // eliminateTheBlankBvRow

  // function eliminateTheBlank(blocks,layerldMap,colNum){
  // if(!blocksIblocks.length===0) return blocks blocks=JSON.parse(JSON.stringify(blocks))
  // let arr=getMarkArray(blocks,colNum)
  // layoutByFill(arr,colNum);
  // gth 0) return
  // irseOSON.stringify(bloc
  // getMarkArray(blocks.colNum)
  // let arr2 = getMarkArray(JSON.parse(JSON.stringify(convertMarkArray(arr)))); layoutByExpand(arr2,layerldMap,false,colNum);
  // let arr3 = getMarkArray(JSON.parse(JSON.stringify(convertMarkArray(arr)))
  // IayoutByExpand(arr3,layerldMap,true,colNum); return convertMarkArray(arr3);
  // exports.eliminateTheBlank = eliminateTheBlank:

  // function layoutByFill(arr,colNum){
  // let locationed = [
  // let autoWith=colNum Il 12
  // JSON.parseUs layerldMap.false.cc
  // tvarkArravdSoN.parsedSo
  // let minBlockWidth=getBaseWidthO
  // let columns=Math.ceil(autoWith/minBlockWidth)
  // for(let i=0;i<arrlength;i++{ for(letj=0;i<columns;j++{ let currBlock = arr[i][j];
  // if(currBlock===0{ Iet range = 0;
  // yerlaMap.true,col ray(arr3):
  // inateTheBlank E eiminateThe
  // let length= Math.max(columns,arr.length); while(range<length
  // coNUM
  // let result = findBlockAndFillBlank(i.j,arr,range,locationed);
  // if(result){ break
  // range++;
  // 1
  // }}
  // }
  // minBlockWidth = getBaseWidthO
  // t columns = Math.ceiautoWith/minB for(et i= 0: i< arr.length: i++)
  // ordeti O:i s columns

  // function findBlockAndFiuBlank(currl.currJ.arr.ranaeJocationed)
  // let i=currlj=currJ
  // let minBlockWidth=getBaseWidthO let minHeight = getBaseHeightO:
  // if(!range  range===0){ let start = {startl:i,startJ:j};
  // let shape={h:minHeight,w:minBlockWidth} let near=findNearestBlock(arr, shape,start) if(near){
  // let {nearl,nearJ,nearData} = near; nearData.x=j*minBlockWidth nearData.y = i;
  // arr[i][i]=nearData arr[nearl][nearJ]=0;
  // return true; return false:
  // if(hasBlankByRange(arr,ij,range'top')) let start = {startl:i,startJ:j};
  // Iet shape = {h:minHeight+range,w:minBlockWidth}, let near = findNearestBlock(arr, shape, start);
  // if(near&&!locationed.includes(near.nearData.layerld)){
  // let {nearl,nearJ,nearData}= near; nearData.x=j*minBlockWidth nearData.y = i-range;
  // for(let index=0;index<=range;index++){
  // if(arr[i-index] l] arr[i-index]===0) arr[i-index][j] = nearData;
  // ifarr[nearl+index]&& arr[nearl+index][nearJ])arr[nearl+index][nearJ]=0
  // locationed.push(nearData.layerld) return true
  // if(hasBlankByRange(arr,ii,range,'left')) let start = {startl:i,startJ:j};
  // let shape={hminHeight,w:minBlockWidth+minBlockWidth*range} letnear=findNearestBlockarr,shape,start)
  // if(near&&!locationed.includes(near.nearData.layerld) let{nearl,nearJ,nearData}=near
  // nearData.x=j*minBlockWidth-range*minBlockWidth nearData.y = i;
  // for(let index=0;index<=range;index++{
  // ifarr[i][i-index]arr[i][j-index]===0)arr[i][j-index]=nearData
  // ifarr[nearl]&&arr[nearl][nearJ+index])arr[nearl][nearJ+index]=0 locationed.push(nearData.layerld)
  // return true;}
  // if(hasBlankByRange(arrii,range'bottom')){
  // let minBlockWidth=getBaseWidthO let start = {startl:i,startJ:j};
  // let shape ={h:minHeight+range,w:minBlockWidth} let near=findNearestBlock(arrshapestart)
  // if(near&&!locationed.includes(near.nearData.layerld)
  // let {nearl,nearJ,nearData} = near; nearData.x=j*minBlockWidth nearData.y = i;
  // for(let index=0;index<=range;index++{
  // if(arr[i+index][j] II arr[i+index][j]===0) arr[i+index][j]= nearData;
  // ifarr[nearl+index]&&arr[nearl+index][nearJ])arr[nearl+index][nearJ]=0
  // locationed.push(nearData.layerld) return true;
  // return false:

  // function hasBlankByRange(arr.i.j,range,direction){ if(direction===top"&&i===0return false if(direction=== "left" &&j===0) return false let result=true
  // for(let index=0;index<=range;index++)i
  // ifdirection===top&& arr[i-index]&& arr[i-index][i]!==0{
  // result = false:}
  // ifdirection===Ieft&&arr[i]&&arr[i[i-index]!==0
  // result = false:}
  // ifdirection===bottom"&& arr[i+index]&& arr[i+index][i]!==0{
  // result = false;}
  // if(direction ==="right"&& arr[i] && arr[i][j+index]!== 0){ result = false;
  // }}
  // return result: Y

  // function findNearestBlock(arr, shape, start) iet {h,w} = shape;
  // Iet{start start} = start let i= startlj= startJ while(i< arr.length
  // whilei< arr[i].length{ let data = arr[i][j];
  // if(data &&data.h===h && data.w===w&&data.y>=startl&&Math.floordatax)>=startJ)
  // return nearl:i nearJ:j.
  // nearData:data
  // }}
  // j++; j=0 i++; Y
  // return null;

  // functionlayoutByExpand(arr,layerldMap,allTrue,colNum){ let autoWith = colNum II 12;
  // let minBlockWidth = getBaseWidthO;
  // let columns = Math.ceil(autoWith/minBlockWidth) for(leti=0;i< arr.length;i++{
  // for(let j= 0; j < columns; j++){
  // let currBlock = arr[i][j]; ifcurrBlock===0{
  // let range = Math.max(columns,arr.length); while(range>=0{
  // let result = findBlockAndExpandBlank(i,j,arr,range,layerldMap,allTrue);
  // if(result){ break}
  // range--:
  // 1 1
  // 1 1

  // function findBlockAndExpandBlank(currl,currJ,arr,range,layerldMap,alITrue) Iet i = currlj = currJ;
  // let minBlockWidth=getBaseWidthO if(range===0){
  // let location = {x:j*minBlockWidth,y:i}; let shape={h:1,w:minBlockWidth}
  // if(expandByHorizontal(arrii,location,shape,layerldMap,alITrue)) return true if(expandByVertical(arr,i.j.location,shape,layerldMap,allTrue)) return true;
  // return false;}
  // if(hasBlankByRange(arr,i,i,range'top')){
  // let location={xi*minBlockWidth,y:Math.max0,i-range)} let shape = {h:1+range, w:minBlockWidth};
  // if(expandByHorizontal(arr,ij,location,shape,layerldMap,allTrue)) return true
  // if(hasBlankByRange(arr,i,j,range,'bottom')) let location={x:j*minBlockWidth,y:i};
  // let shape = {h:1+range, w:minBlockWidth};
  // if(expandByHorizontal(arr,i,j,location,shape,layerldMap,allTrue)) return true; Y
  // if(hasBlankByRange(arr,ij,range,'left')){
  // let location = {x:j*minBlockWidth-range*minBlockWidth, y:i}, let shape ={h:1,wminBlockWidth+minBlockWidth*range};
  // if(expandByVertical(arr,i.j.location,shape,layerldMap,allTrue)) return true; if(hasBlankByRange(arr,i.j,range,'right')){
  // Iet location ={x:j*minBlockWidth+range*minBlockWidth, y:i}, let shape = {h:1, w:minBlockWidth+minBlockWidth*range};
  // if(expandByVertical(arr,i.j.location,shape,layerldMap,allTrue)) return true; return false

  // function expandByVertical(arr,i,ilocation,shape,layerldMap,allTrue)
  // iet expand = hasExpand(arr,ij,location,shape,'top'layerldMap,allTrue); if(expand){
  // letdata=arr[i-1[i]
  // data.h = data.h + shape.h;
  // markBlock(arr,data); return true;:
  // expand=hasExpand(arrij,location,shape,'bottom'layerldMap,allTrue) if(expand){
  // let data= arr[i+1][j];
  // data.h = data.h + shape.h;
  // data.y = location.y: markBlock(arr,data);
  // return true;}
  // return false:

  // function expandByHorizontal(arr,iilocation,shape,layerldMap,allTrue){ letexpand=hasExpand(arrii,location,shape,leftlayerldMap,allTrue) if(expand{
  // letdata=arr[i[i-1]
  // data.w = data.w + shape.w;
  // markBlock(arr,data); return true;:
  // expand = hasExpand(arr,i,j,location,shape,'right',layerldMap,allTrue); if(expand){
  // let data=arr[i][j+1];
  // data.w = data.w + shape.w;
  // data.x = location.x; markBlock(arr,data);
  // return true; return false;

  // function hasExpand(arr,ij,location,shape,direction,layerldMap,allTrue){
  // if(direction === "top" && i===O) return false if (direction === "left " &&j===0) return false
  // let result = false; letdata=
  // switch(direction){ case "top":
  // data = (arr[i-1] && arr[i-1][j])? arr[i-1][j] : {};]
  // result = data.x=== location.x && data.w === shape.w && canExpandByLayerld(arr[i-1][j].layerld, layerldMap,'vertical',allTrue); break;
  // case "bottom":
  // data= (arr[i+1]&& arr[i+1[j? arr[i+1][j]:{}:
  // result = data.x === location.x&& data.w ===shape.w&& canExpandByLayerld(arr[i+1][j].layerld, layerldMap,'vertical',allTrue); break;
  // case "left":
  // data=(arr[i] && arr[i][j-1]) arr[i][j-1]: {};
  // result = data.y === location.y && data.h === shape.h && canExpandByLayerld(arr[i][j-1].layerld, layerldMap, "horizontal',allTrue); break;
  // case "right":
  // data =(arr[i] && arr[i[j+1] arr[i[j+1]:{}:
  // result = data.y=== location.y&& data.h=== shape.h && canExpandByLayerld(arr[i][j+1].layerld, layerldMap,'horizontal,allTrue):
  // break;}
  // return result?data:false; P
  // 10. 142.5.2117 2026 0-

  // function markBlock(arr,item{
  // Iet minBlockWidth = getBaseWidthO Iet {x, y, w, h} = item;
  // if(arr[y] && arr[y].length){
  // let arrX = Math.ceil(x/minBlockWidth); let arrY = y
  // for(letj=0;i< Math.ceil(w/minBlockWidth);i++){ if(arr[arrY]){
  // arr[arrY][arrX+j]=item; Y
  // for(leti=0;i<h;i++{ if(arr[arrY+i]){
  // arr[arrY+i][arrX+i]=item
  // }}
  // for(leti=0;i<h;i++{ if(arr[arrY+i]){
  // arr[arrY+i][arrX]=item;}
  // for(letj=0;i<Math.ceil(w/minBlockWidth);i++){
  // ifarr[arrY+i]){
  // arr[arrY+i][arrX+j]=item
  // 1}

  // function canExpandByLayerldlayerldlayerldMaptypealITrue
  // if(allTrue) return true; let result = [:
  // let data= layerldMap[layerld];
  // ifdata&&data.aspectRatio &&data.aspectRatio!==0&&data.aspectRatio!=='0'){
  // if(data.aspectRatio == 2) result = ['vertical'];
  // } else if(data.aspectRatio == 3{
  // result = ['horizontal'];} else{
  // result=['horizontal''vertical'] Y
  // return result.includes(type):

  // function getMarkArray(out,colNum){
  // let autoWith = colNum II 12 let blocks = out;
  // let minBlockWidth=getBaseWidthO
  // let columns= Math.ceil(autoWith/minBlockWidth) let maxY = Math.max(...blocks.map(item) => item.y)); let maxYArr=blocks.filter(item=>item.y===maxY
  // letmaxYHeiaht=Math.max(maxYArr.map((item=>item.h) let rows = maxY + maxYHeight
  // letarr=new Array(rows); forlet i=0;i<rows;i++{
  // arr[i]=new Arraycolumns.fill(0}
  // blocks.forEachitem,index=> Iet {x, y, w, h} = item;
  // if(arr[y] && arr[y].length){
  // Iet arrX = Math.ceil(x/minBlockWidth); Iet arrY = y:
  // for(let j = 0; j < Math.ceil(w/minBlockWidth); j++)
  // arr[arrY][arrX+j]=item;l forleti=0;i<h;i++){
  // arr[arrY+i][arrX+i]=item
  // } Y
  // forleti=0;i<h;i++{ arr[arrY+i][arrX]=item;
  // for(letj=0;i<Math.ceil(w/minBlockWidth);i++) arr[arrv+il[arrX+i]= item:
  // }
  // }})
  // return JSON.parse(JSON.stringify(arr)):

  // function convertMarkArrayarr{
  // let flattenedArray=arr.reduceacc,cur)=>acc.concatcur,.filteritem=>item!==0 const map = new MapO
  // flattenedArray.forEach(obj =>{
  // map.set(obj.layerld, obj);})
  // Iet result = Array.from(map.valuesQ) return result;

  // function getBaseWidth(){
  //     return 1;
  // }
  // function getBaseHeight(){
  //     return 1;
  // }
});
