# 登录页面重构设计文档

## 概述

重构 Nebula Portal 登录页面，支持多种登录方式（用户名密码、手机号、邮箱、微信），采用组件化架构便于扩展，提升视觉体验。

## 当前状态

### 现有登录方式

| 方式 | 状态 | 实现位置 |
|------|------|----------|
| 用户名密码 | ✅ 已实现 | `login-page.tsx` + `loginWithPassword` API |
| 微信扫码 | ✅ 已实现 | 同上 + `createWechatWebQrCode` / `fetchWechatWebLoginStatus` |
| 微信网页授权 | ✅ 已实现 | 同上 + `prepareWechatWebRedirectLogin` / `loginWithWechatWebRedirectCallback` |
| 手机号验证码 | ❌ 未实现 | 配置字段已定义 (`phoneEnabled`)，需新增 |
| 集成验证码 | ❌ 未实现 | 配置字段已定义 (`emailEnabled`)，需新增 |

### 现有问题

1. **单一组件承载所有逻辑** - `LoginPage` 322行代码，包含4种登录方式的UI和状态管理
2. **微信登录UI分散** - 用 `Divider` 分隔，`Segmented` 切换模式，占用大量垂直空间
3. **扩展性差** - 新增登录方式需要修改核心组件，添加大量条件分支
4. **错误提示嵌入表单** - Alert 组件显示在表单内部，与全局消息提示机制不一致

## 设计方案

### 整体布局

```
┌─────────────────────────────────────┐
│           Brand Logo + Name          │  ← 品牌
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │  标题区                          ││  ← 第一块：当前登录方式名称
│  │  描述                            ││    + 副标题说明
│  ├─────────────────────────────────┤│
│  │  登录表单区                      ││  ← 第二块：当前方式表单
│  │  (输入框 + 按钮)                 ││
│  ├─────────────────────────────────┤│
│  │  "其他登录方式"                  ││  ← 第三块：圆形徽章
│  │  [●] [●] [●] [●]                 ││    切换区
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 三大块结构

| 区域 | 内容 | 说明 |
|------|------|------|
| **标题区** | 登录方式名称 + 描述文字 | 动态显示当前激活方式的标题 |
| **表单区** | 输入字段 + 提交按钮 | 根据登录方式渲染不同表单组件 |
| **徽章区** | 圆形图标按钮列表 | 仅显示启用的登录方式，当前激活徽章高亮 |

### 圆形徽章设计

- **尺寸**: 48px 直径圆形按钮
- **状态**: 默认态 (边框 + 背景)、激活态 (光环 + 放大)、Hover (放大 8% + tooltip)
- **微信徽章**: 使用绿色系配色 (#07c160)
- **交互**: 点击切换登录方式，Hover 显示名称 tooltip

### 错误提示机制

- **移除表单内 Alert** - 不在登录卡片内显示错误信息
- **统一使用全局消息提示** - 使用 Ant Design `message.error()` / `message.warning()`
- **适用场景**: 登录失败、验证码发送失败、微信扫码过期等

## 组件架构

### 新增组件

```
packages/pages-web/src/pages/auth/
├── login-page.tsx              # 主容器组件（重构）
├── login-card.tsx              # 登录卡片布局组件（新增）
├── login-badge-switch.tsx      # 徽章切换组件（新增）
├── login-forms/                # 登录表单组件目录（新增）
│   ├── index.ts                # 导出
│   ├── username-form.tsx       # 用户名密码表单
│   ├── phone-form.tsx          # 手机号验证码表单
│   ├── email-form.tsx          # 集成验证码表单
│   └── wechat-form.tsx         # 微信扫码/网页授权表单
└── login-types.ts              # 共享类型定义（新增）
```

### 组件职责

| 组件 | 职责 | Props |
|------|------|-------|
| `LoginPage` | 状态管理、API调用、全局消息 | 无外部 props |
| `LoginCard` | 三区域布局渲染 | `title`, `desc`, `children`, `badges` |
| `LoginBadgeSwitch` | 徽章列表渲染 + 切换逻辑 | `modes`, `activeMode`, `onChange` |
| `UsernameForm` | 用户名密码表单 + 提交 | `onSubmit`, `loading` |
| `PhoneForm` | 手机号 + 验证码表单 | `onSubmit`, `onSendCode`, `loading` |
| `EmailForm` | 集成 + 验证码表单 | `onSubmit`, `onSendCode`, `loading` |
| `WechatForm` | QR码显示 + 网页授权按钮 | `qrData`, `onRefresh`, `onRedirect` |

### 登录方式类型

```typescript
type LoginMode = 'username' | 'phone' | 'email' | 'wechat-qr' | 'wechat-redirect';

interface LoginModeConfig {
  key: LoginMode;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  formComponent: React.ComponentType<FormProps>;
}
```

## API 需求

### 手机号登录 API（需新增）

```typescript
// 发送短信验证码
POST /api/auth/sms/send
Body: { phone: string }
Response: { success: boolean, expireIn: number }

// 手机号验证码登录
POST /api/auth/sms/login
Body: { phone: string, code: string }
Response: { token, refreshToken, user, ... }
```

### 集成登录 API（需新增）

```typescript
// 发送集成验证码
POST /api/auth/email/send
Body: { email: string }
Response: { success: boolean, expireIn: number }

// 集成验证码登录
POST /api/auth/email/login
Body: { email: string, code: string }
Response: { token, refreshToken, user, ... }
```

## 配置字段映射

```typescript
interface FrontendLoginConfigDto {
  usernameEnabled: boolean;      // → 'username' 徽章显示
  phoneEnabled: boolean;         // → 'phone' 徽章显示
  emailEnabled: boolean;         // → 'email' 徽章显示
  wechatWebEnabled: boolean;     // → 'wechat' 徽章显示
  wechatWebQrEnabled: boolean;   // → 微信表单显示 QR 模式
  wechatWebRedirectEnabled: boolean; // → 微信表单显示网页授权按钮
}
```

## 样式规范

### CSS 变量使用

使用现有 Nebula CSS 变量，确保主题切换时自动适配：

| 变量 | 用途 |
|------|------|
| `--nebula-surface-strong` | 卡片背景色 |
| `--nebula-border` | 边框、分隔线 |
| `--nebula-text` | 主文字颜色 |
| `--nebula-text-muted` | 描述文字、tooltip |
| `--nebula-primary` | 主按钮、激活徽章边框 |
| `--nebula-radius` | 输入框圆角 |
| `--nebula-radius-lg` | 卡片圆角 |

### 新增 CSS 类

```css
.login-card           /* 登录卡片容器 */
.login-section-title  /* 标题区域 */
.login-section-form   /* 表单区域 */
.login-section-badges /* 徽章区域 */
.login-badge-circle   /* 圆形徽章按钮 */
.login-badge-circle--active /* 激活态徽章 */
.login-badge-circle--wechat /* 微信徽章（绿色） */
```

## 国际化

新增翻译字段：

```typescript
// zh-CN
login.mode.username: "用户名"
login.mode.phone: "手机号"
login.mode.email: "邮箱"
login.mode.wechat: "微信"
login.badges.other: "其他登录方式"
login.phone.title: "手机号登录"
login.phone.desc: "验证码将发送至您的手机"
login.email.title: "集成登录"
login.email.desc: "验证码将发送至您的邮箱"
login.code.send: "发送验证码"
login.code.sent: "已发送"
login.code.resend: "重新发送 ({seconds}s)"

// en-US 对应英文翻译
```

## 实现范围

### Phase 1: 架构重构（本次）

- 重构 `LoginPage` 主组件
- 新增 `LoginCard` 布局组件
- 新增 `LoginBadgeSwitch` 徽章切换组件
- 新增 `UsernameForm` 表单组件（拆分现有代码）
- 新增 `WechatForm` 表单组件（拆分现有代码）
- 更新 CSS 样式（`styles.css`）
- 错误提示改用全局消息

### Phase 2: 新登录方式（后续）

- 新增 `PhoneForm` + 手机号登录 API
- 新增 `EmailForm` + 集成登录 API
- 后端 API 实现配合

## 验收标准

1. 用户名密码登录功能正常
2. 微信扫码/网页授权登录功能正常
3. 徽章切换交互流畅，Hover/激活态符合设计
4. 登录失败时显示全局消息提示（非表单内 Alert）
5. 主题切换时样式自动适配
6. 国际化切换正常显示
7. 配置字段正确控制徽章显示/隐藏
8. 禁用登录方式时徽章灰显、表单禁用

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `login-page.tsx` | 重构 | 简化为状态容器 + 子组件组合 |
| `login-card.tsx` | 新增 | 三区域布局组件 |
| `login-badge-switch.tsx` | 新增 | 徽章切换组件 |
| `login-forms/username-form.tsx` | 新增 | 用户名密码表单 |
| `login-forms/wechat-form.tsx` | 新增 | 微信登录表单 |
| `login-forms/phone-form.tsx` | 新增 | 手机号表单（Phase 2） |
| `login-forms/email-form.tsx` | 新增 | 集成表单（Phase 2） |
| `login-forms/index.ts` | 新增 | 导出文件 |
| `login-types.ts` | 新增 | 类型定义 |
| `auth-api.ts` | 扩展 | 新增手机号/集成 API（Phase 2） |
| `auth-messages.ts` | 扩展 | 新增翻译字段 |
| `styles.css` | 修改 | 更新登录样式类 |

## 风险与注意事项

1. **向后兼容**: 现有微信登录逻辑需完整迁移，不可丢失功能
2. **API 未就绪**: 手机号/集成登录 API 需后端先实现，Phase 2 依赖后端进度
3. **配置字段**: 需确认后端 `/api/frontend/init` 返回正确的 `loginConfig` 字段
4. **国际化**: 新增字段需同步更新中英文 messages