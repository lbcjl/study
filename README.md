# TravelGenie 🌍✈️

AI 驱动的智能旅游规划助手

## 项目简介

TravelGenie 是一款基于阿里通义千问 AI 的智能旅游规划应用，通过对话式交互帮助用户快速生成个性化旅行方案。

### ✨ 核心功能

- 🤖 **AI 对话式规划** - 自然语言描述需求，秒懂你的期待
- 🗺️ **智能行程生成** - 基于天数、预算、兴趣自动优化路线
- 🏨 **景点/酒店/美食推荐** - 整合高德地图 POI + 精选 Mock 数据
- 💰 **费用预算计算** - 详细分类统计，超支智能提醒
- 📍 **路线地图可视化** - 高德地图动画展示游览路径

### 🛠️ 技术栈

**前端**:

- React 18 + TypeScript
- Vite 6 (构建工具)
- Tailwind CSS (原子化 CSS)
- Zustand (状态管理)
- Framer Motion (动画)
- React Router (路由)

**后端**:

- NestJS 10 + TypeScript
- Prisma (ORM)
- PostgreSQL (数据库)
- Redis (缓存)

**AI & 地图**:

- 阿里通义千问 API
- 高德地图 API

---

## 📂 项目结构

```
TravelGenie/
├── frontend/          # React 前端应用
│   ├── src/
│   │   ├── components/  # 可复用组件
│   │   ├── pages/       # 页面组件
│   │   ├── hooks/       # 自定义 Hooks
│   │   ├── store/       # Zustand 状态管理
│   │   └── services/    # API 调用服务
│   └── package.json
│
├── backend/           # NestJS 后端服务
│   ├── src/
│   │   ├── modules/     # 功能模块 (ai, trip, map)
│   │   ├── data/        # Mock 数据
│   │   └── prisma/      # 数据库 Schema
│   └── package.json
│
└── docs/              # 项目文档
    ├── REQUIREMENTS.md   # 需求文档
    ├── CHANGELOG.md      # 开发日志
    └── TECH_CONTEXT.md   # 技术上下文
```

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 15 (可选,MVP 阶段可不使用)
- Redis >= 7 (可选)

### 环境变量配置

#### 后端 `.env`

```bash
# 复制模板文件
cd backend
cp .env.example .env

# 编辑 .env 填入你的 API Keys
QWEN_API_KEY=your-qwen-api-key      # 阿里通义千问
AMAP_API_KEY=your-amap-api-key      # 高德地图
```

#### 前端 `.env`

```bash
cd frontend
echo "VITE_AMAP_KEY=your-amap-js-api-key" > .env
```

### 安装依赖

```bash
# 安装前端依赖
cd frontend
pnpm install

# 安装后端依赖
cd ../backend
pnpm install
```

### 启动开发服务器

```bash
# 1. 启动后端 (终端 1)
cd backend
pnpm run start:dev
# 访问: http://localhost:3001/api/health

# 2. 启动前端 (终端 2)
cd frontend
pnpm run dev
# 访问: http://localhost:5173
```

---

## 📝 开发进度

查看 [`task.md`](../.gemini/antigravity/brain/1d94ed87-d7d0-49b1-a95f-ea6db8187b0e/task.md) 了解当前开发进度

---

## 📚 文档

- [需求文档](./docs/REQUIREMENTS.md)
- [技术上下文](./docs/TECH_CONTEXT.md)
- [开发日志](./docs/CHANGELOG.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

---

## 📄 License

MIT
