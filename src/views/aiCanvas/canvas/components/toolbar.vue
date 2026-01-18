<template>
  <div class="canvas-toolbar">
    <div class="toolbar-content">
      <div class="toolbar-space"></div>
      <p-button type="primary" @click="handleSave" size="small">
        <p-icon type="pui-save" />
        保存
      </p-button>
    </div>
  </div>
</template>

<script>
export default {
  name: "Toolbar",
  data() {
    return {};
  },
  created() {},
  mounted() {},
  methods: {
    // 保存事件
    handleSave() {
      this.$emit('save');
    }
  }
};
</script>

<style lang="less" scoped>
.canvas-toolbar {
  background: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  padding: 8px 16px;
  
  .toolbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .toolbar-space {
    flex: 1;
  }
  
  /deep/ .ivu-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .ivu-icon {
      font-size: 14px;
    }
  }
}
</style>