# 参数配置页面 displayOrder 排序修复设计文档

**日期**: 2026-05-08
**作者**: Sisyphus
**状态**: 设计完成，待审核

---

## 1. 背景与问题

### 1.1 现状

Nebula Portal 项目已实现完整的参数管理系统：

- **参数定义页面** (`packages/pages-web/src/pages/advanced/param/index.tsx`)：用于定义参数元数据，包括moduleCode、displayOrder、dataType、验证规则等字段
- **参数配置页面** (`packages/pages-web/src/pages/advanced/param-config/index.tsx`)：自动生成UI界面，用户可编辑参数值

参数配置页面根据参数定义自动渲染表单：
- 按`moduleCode`分组显示为Tab页
- 根据`dataType`自动选择表单控件类型
- 自动应用验证规则

### 1.2 发现的问题

参数定义中包含`displayOrder`字段，用于控制表单字段在Tab页内的显示顺序。但参数配置页面代码未使用该字段进行排序。

**问题代码位置**：`packages/pages-web/src/pages/advanced/param-config/index.tsx` 第121-122行

```typescript
const editableParams = result.filter((p) => p.editableFlag !== false && p.renderEnabled !== false);
setParams(editableParams);  // 缺少排序逻辑
```

**影响**：
- 表单字段顺序不可控，用户体验混乱
- `displayOrder`字段定义无效，参数定义页面的排序配置无意义

---

## 2. 解决方案

### 2.1 方案选择

采用**最小修复方案**：
- 仅修改参数配置页面的排序逻辑
- 不创建新组件，不重构架构
- 风险低，改动小，立即解决问题

### 2.2 实现细节

**修改位置**：`packages/pages-web/src/pages/advanced/param-config/index.tsx` 第121行

**修改内容**：

```typescript
// 原代码
const editableParams = result.filter((p) => p.editableFlag !== false && p.renderEnabled !== false);

// 修改为
const editableParams = result
  .filter((p) => p.editableFlag !== false && p.renderEnabled !== false)
  .sort((a, b) => {
    const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
```

**排序规则**：
1. 按`displayOrder`数值升序排列
2. `displayOrder`为null或undefined的参数排在末尾（使用`Number.MAX_SAFE_INTEGER`作为默认值）
3. JavaScript的sort方法在相同值时保持相对顺序（stable sort behavior）

---

## 3. 数据流设计

```
┌─────────────────────────────────────────────┐
│ API响应: fetchSystemParamsByModule(module)  │
│ 返回 SystemParamItem[]                       │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│ 过滤参数                                    │
│ 条件: editableFlag !== false                │
│       renderEnabled !== false               │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│ 排序参数 ← 新增步骤                         │
│ 规则: displayOrder升序                      │
│       null值排末尾                          │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│ 设置state: setParams(sortedParams)          │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│ 渲染表单                                    │
│ params.map(renderParamField)                │
│ 字段按displayOrder顺序显示                  │
└─────────────────────────────────────────────┘
```

---

## 4. 测试验证方案

### 4.1 功能测试

**测试场景**：

1. **正常排序测试**
   - 创建多个参数，设置不同displayOrder值（如1, 5, 10, 3）
   - 验证表单字段按1, 3, 5, 10顺序显示

2. **null值处理测试**
   - 创建参数，部分有displayOrder，部分为null
   - 验证有displayOrder的参数排在前面，null排在末尾

3. **相同值测试**
   - 创建多个参数，displayOrder相同
   - 验证保持原有相对顺序（stable sort）

4. **Tab切换测试**
   - 切换不同moduleCode的Tab页
   - 验证每个Tab内的参数独立排序

5. **保存功能测试**
   - 编辑参数值
   - 验证保存功能不受排序影响

### 4.2 边界测试

- displayOrder为负数
- displayOrder为极大值
- 全部参数displayOrder为null
- 单个参数的情况

---

## 5. 影响范围分析

### 5.1 受影响文件

- `packages/pages-web/src/pages/advanced/param-config/index.tsx`
  - 修改量：约3行代码
  - 影响功能：参数配置页面的表单字段排序

### 5.2 不受影响

- 参数定义页面（`param/index.tsx`）
- 参数API接口（`system-param-api.ts`）
- SystemParamItem类型定义
- 其他模块功能
- 数据库结构

---

## 6. 实现计划

### 6.1 实现步骤

1. 修改param-config页面代码，添加排序逻辑
2. 本地启动项目，验证修改效果
3. 执行typecheck检查类型错误
4. 手动测试各种场景
5. 提交代码

### 6.2 代码变更预览

```diff
--- a/packages/pages-web/src/pages/advanced/param-config/index.tsx
+++ b/packages/pages-web/src/pages/advanced/param-config/index.tsx
@@ -118,7 +118,11 @@
         if (currentRequestId !== requestIdRef.current) {
           return;
         }
-        const editableParams = result.filter((p) => p.editableFlag !== false && p.renderEnabled !== false);
+        const editableParams = result
+          .filter((p) => p.editableFlag !== false && p.renderEnabled !== false)
+          .sort((a, b) => {
+            const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
+            const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
+            return orderA - orderB;
+          });
         setParams(editableParams);
         const initialValues: ParamConfigFormValue = {};
         for (const param of editableParams) {
```

---

## 7. 风险评估

| 风险项 | 风险等级 | 缓解措施 |
|--------|---------|---------|
| 排序逻辑错误导致字段顺序混乱 | 低 | 充分测试各种场景，包括边界值 |
| null值处理不当 | 低 | 使用Number.MAX_SAFE_INTEGER作为默认值，确保排在末尾 |
| 性能影响 | 极低 | 数组排序开销很小，参数数量通常不超过几十个 |

**总体风险等级**：低

---

## 8. 后续优化建议

本次采用最小修复方案，后续可考虑：

1. **方案B**：创建`NeDynamicForm`通用组件，封装动态表单渲染逻辑，供多个页面复用
2. 增强参数配置页面：
   - 支持参数搜索/筛选
   - 显示参数说明文档
   - 参数分组可视化配置

---

## 9. 参考资料

- SystemParamItem类型定义：`packages/core/src/types.ts` 第47-88行
- 参数配置页面实现：`packages/pages-web/src/pages/advanced/param-config/index.tsx`
- 参数API：`packages/pages-web/src/api/system-param-api.ts`
- AGENTS.md命名规范：kebab-case目录和文件名，PascalCase组件名