/**
 * Layout Calculator - 布局计算器
 * 
 * 功能：
 * 1. 自动计算 Widget 位置（从左到右、从上到下）
 * 2. 避免重叠检测
 * 3. 动态调整布局
 * 4. 支持位置释放和重置
 */

class LayoutCalculator {
  constructor(options = {}) {
    // 网格列数
    this.colNum = options.colNum || 12;
    
    // 间距
    this.margin = options.margin || 8;
    
    // 占用矩阵：二维数组，记录每个单元格是否被占用
    // occupiedMatrix[y][x] = surfaceId 或 null
    this.occupiedMatrix = [];
    
    // Widget 位置映射：surfaceId -> {x, y, w, h}
    this.widgetPositions = new Map();
    
    console.log(`[LayoutCalculator] 初始化: colNum=${this.colNum}, margin=${this.margin}`);
  }

  /**
   * 计算下一个可用位置
   * @param {Number} w - 宽度（网格列数）
   * @param {Number} h - 高度（网格行数）
   * @param {String} surfaceId - Surface ID（可选，用于记录）
   * @returns {Object} {x, y} 坐标
   */
  calculateNextPosition(w, h, surfaceId = null) {
    console.log(`[LayoutCalculator] 计算位置: w=${w}, h=${h}, surfaceId=${surfaceId}`);
    
    // 验证参数
    if (w <= 0 || h <= 0) {
      throw new Error(`宽度和高度必须大于 0: w=${w}, h=${h}`);
    }
    
    if (w > this.colNum) {
      console.warn(`[LayoutCalculator] 宽度 ${w} 超过列数 ${this.colNum}，自动调整为 ${this.colNum}`);
      w = this.colNum;
    }
    
    // 从第 0 行开始扫描
    for (let y = 0; y < 1000; y++) {
      // 从第 0 列开始扫描
      for (let x = 0; x <= this.colNum - w; x++) {
        // 检查当前位置是否可用
        if (this.isPositionAvailable(x, y, w, h)) {
          // 标记为已占用
          this.markPositionOccupied(x, y, w, h, surfaceId);
          
          console.log(`[LayoutCalculator] 找到可用位置: x=${x}, y=${y}`);
          return { x, y };
        }
      }
    }
    
    // 理论上不会到达这里，但作为保险
    const fallbackY = this.getMaxY() + 1;
    this.markPositionOccupied(0, fallbackY, w, h, surfaceId);
    console.warn(`[LayoutCalculator] 未找到合适位置，使用备用位置: x=0, y=${fallbackY}`);
    return { x: 0, y: fallbackY };
  }

  /**
   * 检查位置是否可用
   * @param {Number} x - X 坐标
   * @param {Number} y - Y 坐标
   * @param {Number} w - 宽度
   * @param {Number} h - 高度
   * @returns {Boolean}
   */
  isPositionAvailable(x, y, w, h) {
    // 检查是否超出边界
    if (x < 0 || x + w > this.colNum || y < 0) {
      return false;
    }
    
    // 检查目标区域的每个单元格
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        if (this._isCellOccupied(col, row)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * 标记位置为已占用
   * @param {Number} x - X 坐标
   * @param {Number} y - Y 坐标
   * @param {Number} w - 宽度
   * @param {Number} h - 高度
   * @param {String} surfaceId - Surface ID
   */
  markPositionOccupied(x, y, w, h, surfaceId) {
    // 确保矩阵足够大
    this._ensureMatrixSize(y + h);
    
    // 标记每个单元格
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        this.occupiedMatrix[row][col] = surfaceId;
      }
    }
    
    // 记录 Widget 位置
    if (surfaceId) {
      this.widgetPositions.set(surfaceId, { x, y, w, h });
      console.log(`[LayoutCalculator] 标记占用: surfaceId=${surfaceId}, x=${x}, y=${y}, w=${w}, h=${h}`);
    }
  }

  /**
   * 释放位置
   * @param {String} surfaceId - Surface ID
   */
  releasePosition(surfaceId) {
    const position = this.widgetPositions.get(surfaceId);
    
    if (!position) {
      console.warn(`[LayoutCalculator] 未找到 Widget 位置: ${surfaceId}`);
      return;
    }
    
    const { x, y, w, h } = position;
    
    // 清除占用标记
    for (let row = y; row < y + h; row++) {
      if (this.occupiedMatrix[row]) {
        for (let col = x; col < x + w; col++) {
          if (this.occupiedMatrix[row][col] === surfaceId) {
            this.occupiedMatrix[row][col] = null;
          }
        }
      }
    }
    
    // 删除位置记录
    this.widgetPositions.delete(surfaceId);
    console.log(`[LayoutCalculator] 释放位置: surfaceId=${surfaceId}`);
  }

  /**
   * 更新 Widget 位置
   * @param {String} surfaceId - Surface ID
   * @param {Number} x - 新的 X 坐标
   * @param {Number} y - 新的 Y 坐标
   * @param {Number} w - 新的宽度
   * @param {Number} h - 新的高度
   */
  updatePosition(surfaceId, x, y, w, h) {
    // 先释放旧位置
    this.releasePosition(surfaceId);
    
    // 标记新位置
    this.markPositionOccupied(x, y, w, h, surfaceId);
    
    console.log(`[LayoutCalculator] 更新位置: surfaceId=${surfaceId}, x=${x}, y=${y}, w=${w}, h=${h}`);
  }

  /**
   * 获取 Widget 位置
   * @param {String} surfaceId - Surface ID
   * @returns {Object|null} {x, y, w, h} 或 null
   */
  getPosition(surfaceId) {
    return this.widgetPositions.get(surfaceId) || null;
  }

  /**
   * 重置布局
   */
  reset() {
    this.occupiedMatrix = [];
    this.widgetPositions.clear();
    console.log(`[LayoutCalculator] 重置布局`);
  }

  /**
   * 获取最大 Y 坐标
   * @returns {Number}
   */
  getMaxY() {
    let maxY = -1;
    
    for (const position of this.widgetPositions.values()) {
      const bottomY = position.y + position.h - 1;
      if (bottomY > maxY) {
        maxY = bottomY;
      }
    }
    
    return maxY;
  }

  /**
   * 检查单元格是否被占用
   * @param {Number} col - 列
   * @param {Number} row - 行
   * @returns {Boolean}
   */
  _isCellOccupied(col, row) {
    if (!this.occupiedMatrix[row]) {
      return false;
    }
    return this.occupiedMatrix[row][col] != null;
  }

  /**
   * 确保矩阵大小足够
   * @param {Number} requiredRows - 需要的行数
   */
  _ensureMatrixSize(requiredRows) {
    while (this.occupiedMatrix.length < requiredRows) {
      // 创建新行，初始化为 null
      this.occupiedMatrix.push(new Array(this.colNum).fill(null));
    }
  }

  /**
   * 获取布局统计信息
   * @returns {Object}
   */
  getStats() {
    const totalCells = this.occupiedMatrix.reduce((sum, row) => {
      return sum + row.filter(cell => cell != null).length;
    }, 0);
    
    return {
      widgetCount: this.widgetPositions.size,
      occupiedCells: totalCells,
      maxY: this.getMaxY(),
      matrixRows: this.occupiedMatrix.length
    };
  }

  /**
   * 打印布局矩阵（用于调试）
   * @param {Number} maxRows - 最多打印的行数
   */
  printMatrix(maxRows = 20) {
    console.log(`[LayoutCalculator] 布局矩阵 (前 ${maxRows} 行):`);
    
    for (let y = 0; y < Math.min(maxRows, this.occupiedMatrix.length); y++) {
      const row = this.occupiedMatrix[y];
      const rowStr = row.map(cell => cell ? '■' : '□').join(' ');
      console.log(`Row ${y.toString().padStart(2, '0')}: ${rowStr}`);
    }
  }

  /**
   * 批量计算位置
   * @param {Array} widgets - Widget 配置数组 [{w, h, surfaceId}, ...]
   * @returns {Array} 位置数组 [{x, y, w, h, surfaceId}, ...]
   */
  calculateBatchPositions(widgets) {
    console.log(`[LayoutCalculator] 批量计算 ${widgets.length} 个 Widget 位置`);
    
    const positions = [];
    
    for (const widget of widgets) {
      const { w, h, surfaceId } = widget;
      const { x, y } = this.calculateNextPosition(w, h, surfaceId);
      positions.push({ x, y, w, h, surfaceId });
    }
    
    console.log(`[LayoutCalculator] 批量计算完成`);
    return positions;
  }
}

export default LayoutCalculator;
