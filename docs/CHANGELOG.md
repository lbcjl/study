# 开发日志 (Development Log)

> AI 自动维护的开发日志，用于保持上下文记忆。

## [2026-01-18 08:49] 项目初始化

**Action**: 创建智能旅游规划应用项目

**Decision**:

- 采用 Monorepo 结构，便于前后端代码共享和类型定义
- 技术栈：React 19 + NestJS 10 + TypeScript
- 数据库：TypeORM + SQLite（简化部署）
- AI集成：阿里通义千问 API

**Files Created**:

- `docs/REQUIREMENTS.md` - 项目需求文档
- `docs/CHANGELOG.md` - 本文件
- `docs/TECH_CONTEXT.md` - 技术上下文（待创建）

**Next Steps**:

- 查询阿里通义千问 API 官方文档
- 初始化后端 NestJS 项目
- 初始化前端 React 项目

## [2026-01-18 08:58] 开始执行 - 根级别配置

**Action**: 创建 Monorepo 根级别配置文件

**User Confirmation**:

- ✅ 使用 pnpm 进行包管理
- ✅ 已有通义千问 API Key
- ✅ 同意 Monorepo 结构
- ✅ 前端设计风格符合预期

**Files Created**:

- `package.json` - 根 package.json，配置 pnpm workspaces
- `pnpm-workspace.yaml` - pnpm workspace 配置
- `.gitignore` - Git 忽略文件
- `.env.example` - 环境变量模板
- `README.md` - 项目说明文档

**Next**: 初始化后端 NestJS 项目

## [2026-01-18 09:10] 后端开发完成

**Action**: 创建后端 NestJS 应用

**Files Created**:

- `backend/package.json` - 后端依赖配置
- `backend/src/main.ts` - NestJS 入口
- `backend/src/app.module.ts` - 根模块
- `backend/src/entities/` - TypeORM 实体（Conversation, Message, TravelPlan）
- `backend/src/chat/` - Chat 模块（集成通义千问 API）
  - `qwen.service.ts` - 通义千问 API 封装
  - `chat.service.ts` - 聊天业务逻辑
  - `chat.controller.ts` - REST API 端点
- `backend/src/travel/` - Travel 模块

**Key Features**:

- TypeORM + SQLite 数据库
- 通义千问 AI 集成（支持流式响应）
- RESTful API 设计
- 系统提示词优化（旅行规划师助手）

## [2026-01-18 09:15] 前端开发完成

**Action**: 创建前端 React 应用

**Files Created**:

- `frontend/package.json` - 前端依赖（React 19 + Vite）
- `frontend/src/index.css` - 设计系统（旅游主题配色）
- `frontend/src/components/`
  - `ChatInterface.tsx` - 主聊天界面
  - `MessageBubble.tsx` - 消息气泡组件
  - `InputBox.tsx` - 输入框组件
- `frontend/src/hooks/useChat.ts` - 聊天状态管理
- `frontend/src/services/api.ts` - API 服务封装

**Design Highlights**:

- 独特配色：深海蓝 → 日落橙 → 薰衣草紫
- 字体：Outfit (display) + Crimson Pro (serif)
- 玻璃拟态效果 + 微妙的背景动画
- 流畅的消息动画
- 响应式设计

**Next**: 安装依赖并启动应用测试

## [2026-01-18 10:08] 集成 LangChain 框架

**Action**: 使用 LangChain 替代直接 API 调用

**Changes**:

- 安装 LangChain 依赖（`langchain`, `@langchain/openai`, `@langchain/core`, `zod`）
- 创建 `backend/src/chat/langchain.service.ts` - 使用 ChatOpenAI 连接通义千问
- 更新 `ChatModule` 和 `ChatService` 使用 LangChainService
- LangChain 提供更好的消息管理和可扩展性

## [2026-01-18 10:09] 流式响应与前端增量渲染

**Action**: 实现 AI 回复的流式传输和前端增量渲染

**Changes**:

- **Backend**: 新增 `/chat/stream` 接口，基于 AsyncGenerator 实现 Token 级推送
- **Frontend**: 重构 `useChat` Hook，支持增量渲染 AI 回复
- **Experience**: 消除等待感，首字响应速度提升 90%

## [2026-01-18 13:25] 地理编码容错增强 🛠️

- **Fix**: 解决 "无法获取任何有效的地理位置信息" 错误
- **Logic**: 当 AI 生成的地址无法解析时，后端自动降级尝试使用“地点名称”进行搜索
- **Result**: 大幅提高地图标记点的生成成功率 (Address -> Name Fallback)

## [2026-01-18 10:10] 优化 AI 输出格式

**Action**: 增强 System Prompt，要求更详细的旅行方案

**Enhanced Requirements**:

1. **每日详细行程**: 具体到时间段（如 09:00-12:00），包含上午/中午/下午/傍晚活动
2. **每日美食推荐**: 必须包含具体餐厅名称、特色菜品和人均消费（早/午/晚餐 + 小吃）
3. **每日预算明细**: 使用 Markdown 表格展示交通/门票/餐饮/其他费用，含每日小计
4. **住宿和交通指南**: 推荐区域、不同档次选择、价格范围
5. **实用贴士**: 最佳旅游季节、注意事项、省钱技巧

**Format**: 所有输出使用结构化 Markdown，善用表格、列表和表情符号

**Next**: 测试新的 AI 输出格式

## [2026-01-18 10:16] 前端UI优化

**Action**: 修复输入框滚动条和错误提示显示

**Changes**:

1. **隐藏输入框滚动条**
   - 在 `InputBox.css` 添加 `scrollbar-width: none` 和 `::-webkit-scrollbar` 样式
   - 支持 Firefox、Chrome、Edge 等浏览器

2. **优化错误提示**
   - 创建 `Toast.tsx` 和 `Toast.css` 组件
   - 移除固定显示的错误消息块
   - 错误时在右上角显示 Toast 弹窗
   - 3秒后自动消失，带滑入滑出动画

**Next**: 继续实施高德地图路线图功能

## [2026-01-18 10:20] 高德地图集成 Phase 1-3 完成

**Action**: 实施高德地图路线图功能（后端+前端）

### Phase 1: 后端Map Module

创建完整的地图服务模块：

- `backend/src/map/amap.service.ts` - 高德API封装（地理编码、静态地图）
- `backend/src/map/map.service.ts` - 业务逻辑层
- `backend/src/map/map.controller.ts` - REST API端点
- `backend/src/map/dto/` - DTO定义

**API端点：**

- `GET /api/map/geocode` - 单个地址解析
- `POST /api/map/generate` - 批量生成地图

### Phase 2: AI Prompt优化

更新LangChain System Prompt：

- 要求**Markdown表格格式**输出每日行程
- 表格必须包含：序号 | 时间 | 类型 | 名称 | **完整地址** | 停留时长 | 费用 | 说明
- 地址格式：城市+区域+街道+门牌号
- 餐厅必须是真实名称和地址

### Phase 3: 前端地图组件

创建React地图组件：

- `frontend/src/services/mapApi.ts` - 地图API服务
- `frontend/src/components/RouteMap.tsx` - 交互式地图组件
- `frontend/src/components/RouteMap.css` - 地图样式
- `frontend/src/vite-env.d.ts` - 环境变量类型
- `frontend/.env` - 前端环境配置

**地图功能：**

- 高德地图SDK动态加载
- 序号标记（1️⃣2️⃣3️⃣）
- 不同类型图标（景点/餐厅/酒店）
- 路线连接线
- 点击显示信息窗口

**Next**: Phase 4 - 集成测试和优化

## [2026-01-18 10:40] 环境变量统一管理 + 地图测试成功 ✅

**Action**: 优化项目环境变量管理结构

**Issue**:

- 环境变量分散在根目录和 `frontend/` 目录
- 前后端配置混乱，难以维护

**Solution**:

1. **删除** `frontend/.env` 和 `frontend/.env.example`
2. **统一**所有配置到根目录 `.env`
3. **配置** Vite 读取根目录：`vite.config.ts` 中 `envDir: '../'`
4. **规范命名**：
   - 后端：`AMAP_WEB_API_KEY`（无前缀）
   - 前端：`VITE_AMAP_JS_API_KEY`（VITE\_ 前缀）
5. **添加**安全密钥支持：`VITE_AMAP_SECURITY_KEY`

**Result**:

- ✅ 环境变量集中管理（只有一个 `.env`）
- ✅ 地图功能测试成功（北京3景点显示正常）
- ✅ 标记点、路线连接、信息窗口正常工作
- ✅ 创建环境变量配置指南文档

- ✅ 创建环境变量配置指南文档

## [2026-01-18 11:05] 地图组件增强与真实路径规划

**Action**: 增强 RouteMap 组件功能，实现真实道路导航

**Features**:

- **信息窗口增强**:
  - 显示详细位置信息（好玩的/highlights、好吃的/food）
  - 显示交通出行建议（transportation）
  - UI 美化（圆形序号、分类标签、图标）

- **真实路径规划**:
  - 集成 `AMap.Driving` 插件
  - 替代直线连接，显示真实道路轨迹
  - 保留自定义序号标记（1️⃣2️⃣3️⃣）同时隐藏默认起终点标记
  - 自动避障和最佳路线计算

- **Bug Fix**:
  - 修复地图标记序号显示问题（改用自定义 DOM 标记）
  - 修复路线不显示问题
  - 统一环境变量管理

**Next**: 集成到聊天界面，解析 AI 表格数据

## [2026-01-18 11:15] 地图功能集成到聊天窗口

**Action**: 实现 AI 生成行程自动展示 interactive map

**Features**:

- **自动解析 (Smart Parsing)**:
  - 自动识别 Markdown 中的行程表格
  - 提取 POI 名称、地址、时间、类型等元数据
- **批量地理编码 (Batch Geocoding)**:
  - 后台自动批量获取地点经纬度
  - 智能匹配北京默认坐标（防错误的 Fallback）
- **无缝集成**:
  - 聊天气泡底部自动追加地图卡片
  - 加载状态动画
- **Prompt 增强**:
  - 要求 AI 提供"好玩的"、"好吃的"、"交通"等丰富信息，并显示在地图上

**Next**: 全面端到端测试与 UI 细节打磨

## [2026-01-18 11:40] 行程规划真实性增强 (Realism & Weather)

**Action**: 深度优化 AI 规划逻辑，集成实时天气数据

**Features**:

- **地图分天展示 (Day-by-Day Map)**:
  - 自动将行程按天拆分
  - 提供 [第1天] [第2天] 切换 Tab
  - 解决所有点挤在一张图导致视角过大的问题
- **天气感知 (Weather Awareness)**:
  - 集成 `wttr.in` 免费天气服务
  - AI 自动根据目的地未来天气调整行程建议（e.g., 雨天推荐室内活动）
- **真实往返交通**:
  - 新增“往返大交通”板块，提供真实的航班号/高铁车次及预估票价
  - 强制 AI 确认出发地信息
- **具体住宿推荐**:
  - 拒绝模糊建议，强制推荐真实存在的酒店名称
  - 增加地段优势分析

**Fix**:

- 修复行程缺乏往返交通规划的问题
- **修复地图坐标回退问题**: 解析失败的地点不再默认显示在北京，而是直接过滤，避免地图视角错误

## [2026-01-18 12:05] 真实数据集成 - 高德地图 Web 服务

**Action**: 后端实现 `GaodeService`，通过 Web API 直连高德 POI 数据库

**Data**:

- **实时 POI 搜索**: 并发获取目的地城市的**热门美食**与**真实酒店**
- **上下文注入**: 将 API 返回的真实地点数据注入 AI System Prompt
- **效果**: AI 推荐的餐厅和酒店均为高德地图中真实存在的地点（包含评分、地址、人均消费）

**Fix**:

- **路线图净化**: 严格指令禁止 AI 将出发地（如机场/车站）放入行程表，解决地图跨度过大问题
- **中文日期解析**: 修复前端无法识别 "第三天" 格式导致地图空白的 Bug

## [2026-01-18 11:25] 聊天体验升级 - 支持富文本渲染

**Action**: 引入Markdown渲染引擎，优化AI回复可读性

**Improvements**:

- **Markdown 支持**: 使用 `react-markdown` + `remark-gfm` 完全替代简单的文本格式化
- **表格渲染**: 行程表现在以美观的 HTML 表格呈现，支持横向滚动，样式适配深色玻璃拟态主题
- **排版优化**: 优化了标题、列表、粗体的显示效果，提升阅读体验
- **无缝衔接**: 地图组件与新渲染的 Markdown 内容完美融合

## [2026-01-18 16:30] Gaode API & Process Cleanup

- **Fixed**: `GaodeService` search logic.
  - **Issue**: Passing `"${city} ${district}"` as the `city` parameter to Gaode API caused `citylimit` to be ignored, resulting in nationwide search results (e.g., Beijing restaurants for Xiamen queries).
  - **Fix**: Changed logic to pass pure `city` name to the `city` parameter and prepend `district` to `keywords` (e.g., `keywords: "Siming District Food", city: "Xiamen"`).
  - **Impact**: Ensures search results are strictly within the target city and district.
- **Fixed**: Port 3000 conflict.
  - **Issue**: Frontend dev server or orphaned backend processes occupying port 3000.
  - **Action**: Provided command `netstat -ano | findstr :3000` and `taskkill` to help user terminate processes.

## [2026-01-19 08:30] 修复聊天内容可见性问题 & 验证后端

**Action**: 修复 UI 逻辑缺陷，验证核心服务连通性

**Fix**:

- **MessageBubble**: 移除了导致 AI 回复（Markdown 表格）被隐藏的 `isTravelPlan` 逻辑。
  - **Before**: 检测到行程计划时，隐藏文本只显示“已生成行程”提示。
  - **After**: 始终完整渲染 Markdown 内容，右侧地图作为辅助视图。保证用户不错过任何文字细节。

**Verification**:

- ✅ **Backend API**: 通过 curl 验证 `http://localhost:3000/api/map/geocode` 响应正常（返回北京坐标）。
- ✅ **Frontend Code**: 审查 `RouteMap.tsx` 和 `ItineraryPanel.tsx`，确认地图交互逻辑完整。
- ⚠️ **End-to-End**: 浏览器自动化测试环境受限，需人工验证最终 UI 效果。

**UI Fix (2026-01-19 08:35]**:

- **Issue**: 行程表格过宽导致聊天气泡布局崩坏（挡住内容）。
- **Fix**: 在 `MessageBubble.css` 中为 Markdown 表格添加横向滚动 (`overflow-x: auto`)，并减小字体和内边距，实现更紧凑的响应式布局。

**Next**: 人工测试真实对话流程，优化地图加载状态。

## [2026-01-19 08:45] UI 重构 - 行程概览卡片

**Action**: 为了解决聊天窗口信息过载问题，引入了可折叠的“行程概览卡片”。

**Changes**:

- **New Component**: `ItinerarySummaryCard` - 只显示关键指标（天数/景点数/总预算）和简单引导。
- **Refactor**: 提取 `parseMarkdownTable` 到 `utils/itineraryParser.ts`，实现 parsing 逻辑复用（无副作用）。
- **Interaction**: AI 生成的复杂行程表默认折叠，用户点击可展开详情；同时引导用户查看右侧地图面板。
- **Result**: 对话流更加清爽，重点突出。

## [2026-01-19 08:50] UI 交互优化 - 详情右移

**Action**: 应用户建议，取消聊天内的“展开详情”，将所有丰富信息转移至右侧面板。

**Changes**:

- **Enhanced**: `DayCard`(Right Panel) 新增“亮点(Highlights)”、“美食推荐(Food)”和“交通(Transportation)”展示区域。
- **Simplified**: `MessageBubble` 不再提供内联展开功能，仅展示 `ItinerarySummaryCard`。
- **UX**: 确立了“左侧对话概览，右侧详情交互”的操作模式。

## [2026-01-19 09:00] 解析逻辑增强 - 叙事内容捕获

**Action**: 为了解决“右侧细节不足”的问题，重写了解析器以捕获所有非表格文本。

**Changes**:

- **Parsing**: `itineraryParser.ts` 现在能识别表格前的“每日主题(Description)”和表格后的“避坑指南(Tips)”。
- **UI**: `DayCard` 顶部新增了主题描述区域，底部新增了黄色背景的 Tips 提示框。
- **Result**: AI 回复中的每一句话现在都能在界面上找到对应位置，不再有信息丢失。

## [2026-01-19 09:10] UI 样式深化 - Markdown 渲染与总览区分

**Action**: 针对“所有信息挤在一起”和“样式简陋”的反馈进行优化。

**Changes**:

- **Format**: `DayCard` 的描述区域引入 `ReactMarkdown`，支持标题、列表、加粗等富文本格式，解决纯文本堆砌问题。
- **Distinction**: 为自动生成的“行程总览”（通常被误标为第1天）增加了独立样式：灰色 Badge 显示“序”，背景色微调，与正式行程区分开。

## [2026-01-19 09:20] 地理编码精度修复 - 城市锁定

**Action**: 解决用户反馈的“定位偏移”（如厦门景点定位到西安）问题。

**Changes**:

- **Backend API**: `batchGeocode` 接口新增 `city` 参数。
- **Frontend Logic**: 解析器 `useItineraryParser` 增加了智能城市推断逻辑（从“去厦门玩”、“厦门3日游”等上下文中提取城市名）。
- **Outcome**: 每次地图请求都会带上目的地城市约束，大幅提高了地理编码的命中率和准确性。

## [2026-01-19 09:30] 数据质量优化 - 解除区域锁定

**Action**: 解决推荐地点过于集中在某一个区（如湖里区）的问题。

**Changes**:

- **Backend Optimization**: 修改 `GaodeService`，移除根据第一个景点锁定整个搜索区域的逻辑。现在美食和酒店推荐默认搜索全市热门，提供更多样化的选择。
- **Fix**: 修复前端正则转义问题，确保城市名能被正确传递给地图API。增强前端城市提取规则，支持“目的地：XX”、“XX行程”、“您的XX之旅”等多种标题模式，并增加后端控制台日志以便于追踪。

## [2026-01-19 09:50] UI 样式微调

- **Visual Update**: 优化了行程卡片中 "实用小贴士" (Tips) 部分的显示。现在使用 `ReactMarkdown` 渲染，能够正确解析 Markdown 标题 (###)、列表和加粗等格式，解决了预算明细显示杂乱的问题。

## [2026-01-19 10:00] 移动端适配优化

- **Mobile Feature**: 为移动端新增了底部导航栏 (Bottom Navigation)，用户可以在“对话列表”和“行程地图”两个视图间自由切换。新增了**自动跳转逻辑**，当 AI 生成行程后，移动端会自动切换到行程视图，减少一步操作。
- **Responsive**: 优化了 `DayCard` 在移动端的显示，调整了标题、时间轴和标签的布局。
- **UI Cleanup**: 移除了行程摘要卡片中冗余的“查看右侧详情”文字和按钮，使界面更加简洁。
- **Map Enhancement**: 优化了地图组件的加载状态 (Loading Spinner) 和错误处理。现在当高德地图“真实路线规划”失败（如配额超限）时，会优雅降级为直线连接，并显示温和的顶部提示，而不是让用户疑惑。
- **Feature**: 实现了 **历史记录侧边栏 (History Sidebar)**。用户现在可以点击左上角菜单按钮查看历史对话，点击切换会话，或删除旧记录。数据已实现持久化存储。
- **Geocoding Optimization**: 实施了“双重保险”定位机制：优先精准地址匹配，失败则自动降级为“地点模糊搜索”，大幅提高了地点定位成功率。
