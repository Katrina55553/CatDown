# CatDown

> Windows 桌面下班倒计时小部件 · Countdown + Off-duty

CatDown 是一款常驻系统托盘的 Windows 桌面小部件，帮你直观掌握距离下班还有多久，并实时估算今天已经赚了多少钱。名称双关：**Countdown**（倒计时）+ **Off-duty**（下班）。

程序点击托盘图标后展开主窗口，左侧是实时预览区，右侧是配置面板。所有计算逻辑为纯函数，覆盖 70 个单元测试，确保跨夜、跨周末、节假日等复杂边界场景下不出现负数或错误文案。

## 功能特性

### 时间倒计时

- 主倒计时：根据当前时间自动切换「距离上班」/「下班还有」/「距离上班还有 N 天 X 小时」
- 工作日可配置：默认周一到周五，支持任意组合（含调休/值班排班）
- 工作时间可配置：精确到分钟（默认 09:00–18:00）
- 跨夜/跨周末正确处理：周五下班后自动跳转到下周一上班时间
- 内置中国大陆法定节假日（2025–2027），节假日视为非工作日，可手动增删

### 收入计算

- 月薪模式：`月薪 / 当月工作日 / 每日工时 × 今日已工作时长`
- 日薪模式：`日薪 / 每日工时 × 今日已工作时长`（不依赖当月工作日天数）
- 月薪/日薪可随时切换
- 小数位数可选（0/2/3 位）
- 未设置薪资时不显示卡片，并给出提示

### 辅助卡片（可独立开关）

- 发薪日倒计时：支持遇节假日提前到最近工作日
- 距离周五：显示还需多少天到达周五
- 下一个节日：显示最近一个法定节假日名称与剩余天数

### 视觉自定义

- 字体颜色：8 个预设纯色 + 渐变编辑器（线性/径向、角度滑块、色标增删改）
- 背景：纯色模式 / 图片模式（支持本地图片裁剪，16:9、1:1、自由比例）
- 猫咪插画：可开关，带呼吸动画
- 极简模式：隐藏配置面板，仅保留预览区（浮动齿轮按钮可唤回）
- 温馨珊瑚粉主题色

### 桌面集成

- 系统托盘常驻，点击展开主窗口
- 开机自启（托盘菜单勾选项）
- 配置本地持久化（JSON 文件）
- 图片背景复制到 `userData/bg/`，避免原图移动后失效

## 技术栈

| 分类 | 技术 |
|---|---|
| 框架 | Electron 33 + Vue 3.5 |
| 构建 | electron-vite + Vite 5 |
| 状态管理 | Pinia 2 |
| 打包 | electron-builder + NSIS |
| 图片裁剪 | cropperjs 1.x |
| 时间库 | dayjs |
| 测试 | Vitest 4 |
| 语言 | TypeScript 5.7 |

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

国内网络如遇 Electron 二进制下载慢，可设置镜像：

```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
```

### 开发模式

```bash
npm run dev
```

启动 electron-vite 热更新开发服务器。

### 类型检查

```bash
npm run typecheck
```

### 运行测试

```bash
npm test
```

执行 Vitest 全部单元测试（70 个用例）。

## 打包

生成 NSIS 安装包：

```bash
npm run dist
```

产物位于 `release/` 目录：

- `CatDown-0.1.0-x64-setup.exe` — NSIS 安装程序（推荐分发）
- `win-unpacked/CatDown.exe` — 免安装版，双击即可运行

仅生成免安装目录（不打包安装程序，速度更快）：

```bash
npm run dist:dir
```

> 如打包时出现 `GitHub Personal Access Token is not set` 警告，可忽略。这是 electron-builder 尝试隐式发布到 GitHub Release 导致的，不影响安装包生成。如需消除，可在 `package.json` 的 `build` 块中添加 `"publish": null`。

## 项目结构

```
CatDown/
├── docs/
│   └── prd.md                    # 产品需求文档
├── resources/
│   └── holidays.json             # 中国大陆法定节假日数据
├── src/
│   ├── main/                     # Electron 主进程
│   │   ├── index.ts              # 入口：窗口/IPC/生命周期
│   │   ├── tray.ts               # 系统托盘与右键菜单
│   │   ├── config.ts             # 配置读写与持久化
│   │   ├── holidays.ts           # 节假日数据管理
│   │   ├── background.ts         # 背景图片选择/保存/读取
│   │   └── auto-start.ts         # 开机自启封装
│   ├── preload/
│   │   └── index.ts              # contextBridge 暴露安全 API
│   ├── renderer/                 # Vue 3 渲染进程
│   │   ├── src/
│   │   │   ├── App.vue           # 主界面（预览区 + 配置面板）
│   │   │   ├── main.ts           # Vue 应用入口
│   │   │   ├── stores/config.ts  # Pinia 配置 store
│   │   │   └── components/
│   │   │       ├── ColorPicker.vue       # 字体颜色选择（纯色 + 渐变入口）
│   │   │       ├── GradientEditor.vue    # 渐变编辑弹窗
│   │   │       ├── BackgroundPicker.vue  # 背景模式选择
│   │   │       ├── ImageCropper.vue      # cropperjs 封装
│   │   │       └── CatIllustration.vue   # 猫咪 SVG 插画
│   │   └── index.html
│   └── shared/                   # 纯函数引擎层（可独立测试）
│       ├── types.ts              # 类型定义与默认值
│       ├── engine.ts             # 倒计时核心引擎
│       ├── income.ts             # 收入计算引擎
│       ├── payday.ts             # 发薪日计算
│       ├── auxiliary.ts          # 周五/节日辅助卡片
│       ├── font-color.ts         # FontColor → CSS 转换
│       └── *.test.ts             # 单元测试（70 个）
├── electron.vite.config.ts
├── package.json
└── tsconfig.*.json
```

## 配置说明

所有用户配置保存在 `%APPDATA%/catdown/config.json`，首次启动自动生成默认配置。

主要配置项：

| 字段 | 说明 | 默认值 |
|---|---|---|
| `workdays` | 工作日（0=周日, 1=周一, ..., 6=周六） | `[1,2,3,4,5]` |
| `startTime` / `endTime` | 上下班时间（HH:MM） | `09:00` / `18:00` |
| `salaryType` | 薪资类型：`monthly` / `daily` | `monthly` |
| `monthlySalary` | 月薪（元），0 表示未设置 | `0` |
| `dailySalary` | 日薪（元），0 表示未设置 | `0` |
| `incomeDecimals` | 收入小数位数 | `2` |
| `payday` | 每月发薪日（1-31） | `10` |
| `paydayAdvanceOnHoliday` | 遇节假日提前发 | `true` |
| `fontColor` | 字体颜色（纯色或渐变） | `#fff8f0` |
| `background` | 背景配置（颜色/图片） | `#ff7e8b` |
| `showCat` | 显示猫咪插画 | `true` |
| `minimalMode` | 极简模式 | `false` |
| `autoStart` | 开机自启 | `false` |

## 开发约定

- **纯函数引擎层**：所有时间/收入/发薪日计算逻辑放在 `src/shared/`，不依赖 Electron API，便于单元测试
- **IPC 通道集中定义**：所有通道名称在 `src/shared/types.ts` 的 `IPC_CHANNELS` 中统一管理
- **类型安全**：主进程、预加载、渲染进程各有独立 tsconfig，`npm run typecheck` 统一校验
- **测试先行**：引擎层每个模块配套 `.test.ts`，修改逻辑前先跑测试

## License

MIT © Katrina55553

## 相关链接

- [产品需求文档](docs/prd.md)
- [GitHub 仓库](https://github.com/Katrina55553/CatDown.git)
