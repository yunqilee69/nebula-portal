# 参数配置页面 displayOrder 排序修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复参数配置页面未按 displayOrder 排序的问题，使表单字段按定义顺序显示。

**Architecture:** 最小化修复方案 - 仅修改参数过滤逻辑，添加 displayOrder 升序排序，null 值排末尾。

**Tech Stack:** React, TypeScript, Ant Design Form

---

## 文件结构

**受影响文件：**
- Modify: `packages/pages-web/src/pages/advanced/param-config/index.tsx:121` - 添加排序逻辑

**无新文件创建。**

---

## Task 1: 修改参数配置页面添加排序逻辑

**Files:**
- Modify: `packages/pages-web/src/pages/advanced/param-config/index.tsx:121`

- [ ] **Step 1: 打开目标文件并定位修改位置**

文件路径：`packages/pages-web/src/pages/advanced/param-config/index.tsx`

定位到第116-122行，当前代码：

```typescript
fetchSystemParamsByModule(activeModule)
  .then((result) => {
    if (currentRequestId !== requestIdRef.current) {
      return;
    }
    const editableParams = result.filter((p) => p.editableFlag !== false && p.renderEnabled !== false);
    setParams(editableParams);
```

---

- [ ] **Step 2: 修改代码添加排序逻辑**

将第121-122行的单行过滤改为多行链式调用，添加排序：

```typescript
const editableParams = result
  .filter((p) => p.editableFlag !== false && p.renderEnabled !== false)
  .sort((a, b) => {
    const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
setParams(editableParams);
```

完整修改后的代码段（第116-134行）：

```typescript
fetchSystemParamsByModule(activeModule)
  .then((result) => {
    if (currentRequestId !== requestIdRef.current) {
      return;
    }
    const editableParams = result
      .filter((p) => p.editableFlag !== false && p.renderEnabled !== false)
      .sort((a, b) => {
        const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    setParams(editableParams);
    const initialValues: ParamConfigFormValue = {};
    for (const param of editableParams) {
      initialValues[param.paramKey] = normalizeParamValue(param);
    }
    form.setFieldsValue(initialValues);
  })
  .finally(() => {
    if (currentRequestId === requestIdRef.current) {
      setLoadingParams(false);
    }
  });
```

---

- [ ] **Step 3: 执行 TypeScript 类型检查**

Run: `pnpm typecheck`

Expected: PASS - 无类型错误（SystemParamItem.displayOrder 类型为 number | undefined，与排序逻辑兼容）

---

- [ ] **Step 4: 本地启动项目验证修改效果**

Run: `pnpm dev`

Expected:
- 项目启动成功
- 访问参数配置页面（路径根据实际路由）
- Tab 页内参数字段按 displayOrder 从小到大顺序显示
- displayOrder 为 null 的参数排在末尾

---

- [ ] **Step 5: 提交修改**

```bash
git add packages/pages-web/src/pages/advanced/param-config/index.tsx
git commit -m 'fix(pages-web): 参数配置页面按displayOrder排序字段显示顺序'
```

Expected: Commit 成功

---

## Task 2: 手动功能验证

**Files:**
- Verify: 参数配置页面运行时行为

- [ ] **Step 1: 测试正常排序场景**

操作：
1. 在参数定义页面创建多个参数，设置不同 displayOrder（如：param1=10, param2=5, param3=1, param4=3）
2. 确保所有参数的 moduleCode 相同，renderEnabled=true, editableFlag=true
3. 访问参数配置页面，切换到对应 moduleCode 的 Tab
4. 观察表单字段显示顺序

Expected: 字段按 displayOrder=1, 3, 5, 10 顺序显示（param3, param4, param2, param1）

---

- [ ] **Step 2: 测试 null 值处理**

操作：
1. 创建参数 param5，displayOrder 不设置（null 或 undefined）
2. 创建参数 param6，displayOrder=2
3. 访问参数配置页面

Expected: 字段顺序为 param6(displayOrder=2), param3(1), param4(3), param2(5), param1(10), param5(null)

---

- [ ] **Step 3: 测试 Tab 切换独立性**

操作：
1. 创建不同 moduleCode 的参数（如 module1 和 module2）
2. 各模块内的参数设置不同 displayOrder
3. 切换不同 Tab 页

Expected: 每个 Tab 内的参数独立排序，不影响其他 Tab

---

- [ ] **Step 4: 测试保存功能不受影响**

操作：
1. 修改参数值
2. 点击保存按钮

Expected:
- 保存成功，显示成功提示
- 参数值正确保存到数据库
- 排序逻辑不影响保存功能

---

## Task 3: 边界情况验证

**Files:**
- Verify: 参数配置页面边界场景

- [ ] **Step 1: 测试负数 displayOrder**

操作：
1. 创建参数，displayOrder=-1
2. 创建参数，displayOrder=1

Expected: displayOrder=-1 的参数排在最前面（升序排列）

---

- [ ] **Step 2: 测试全部参数 displayOrder 为 null**

操作：
1. 创建多个参数，全部不设置 displayOrder

Expected: 所有参数显示顺序保持原有 API 返回顺序（stable sort）

---

- [ ] **Step 3: 测试单个参数**

操作：
1. 模块内只有一个参数

Expected: 正常显示，排序逻辑不报错

---

## Self-Review

**1. Spec coverage:** ✅
- 排序逻辑添加 - Task 1 Step 2
- displayOrder 升序排列 - Task 1 Step 2
- null 值排末尾 - Task 1 Step 2（Number.MAX_SAFE_INTEGER）
- 类型检查 - Task 1 Step 3
- 功能测试 - Task 2
- 边界测试 - Task 3

**2. Placeholder scan:** ✅
- 无 TBD/TODO
- 所有代码完整
- 所有命令明确

**3. Type consistency:** ✅
- SystemParamItem.displayOrder 类型为 number | undefined
- 排序逻辑兼容（?? 操作符处理 undefined）

**4. Spec 需求与计划对应检查：**

| Spec 章节 | Plan Task | 状态 |
|-----------|-----------|------|
| 2.2 实现细节 | Task 1 Step 2 | ✅ |
| 4.1 功能测试 | Task 2 | ✅ |
| 4.2 边界测试 | Task 3 | ✅ |
| 6.1 实现步骤 | Task 1-3 | ✅ |

所有 Spec 需求均有对应 Task 实现。

---

## 实施完成标记

- [ ] **所有 Task 完成后执行最终验证**

Run: `pnpm typecheck && pnpm build`

Expected: PASS - 无错误

- [ ] **最终 commit（如需要）**

```bash
git status
# 确认所有修改已提交
```

---

**计划完成时间预估：** 30 分钟（修改 + 测试 + 验证）