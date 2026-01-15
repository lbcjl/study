# TravelGenie - 技术上下文文档

> 记录项目结构、核心技术、架构决策，便于快速回忆项目细节

---

## 📐 项目架构概览

```
TravelGenie/
├─ frontend/           # React 前端应用
│  ├─ src/
│  │  ├─ components/   # UI 组件
│  │  │  ├─ chat/      # 聊天相关组件
│  │  │  ├─ map/       # 地图相关组件
│  │  │  ├─ itinerary/ # 行程展示组件
│  │  │  └─ ui/        # 基础 UI 组件
│  │  ├─ pages/        # 页面组件
│  │  ├─ hooks/        # 自定义 Hooks
│  │  ├─ store/        # Zustand 状态管理
│  │  ├─ services/     # API 调用服务
│  │  └─ utils/        # 工具函数
│  ├─ public/
│  └─ package.json
│
├─ backend/            # NestJS 后端服务
│  ├─ src/
│  │  ├─ modules/
│  │  │  ├─ auth/      # 用户认证 (可选)
│  │  │  ├─ ai/        # 通义千问 API 集成
│  │  │  ├─ trip/      # 行程规划逻辑
│  │  │  ├─ map/       # 高德地图 API
│  │  │  └─ recommend/ # 推荐系统
│  │  ├─ common/       # 公共模块
│  │  ├─ config/       # 配置
│  │  └─ prisma/       # Prisma Schema
│  └─ package.json
│
└─ docs/               # 项目文档
   ├─ REQUIREMENTS.md  # 需求文档
   ├─ CHANGELOG.md     # 开发日志
   └─ TECH_CONTEXT.md  # 本文件
```

---

## 🛠️ 前端技术栈

### 核心框架

| 技术             | 版本  | 用途     | 官方文档                   |
| ---------------- | ----- | -------- | -------------------------- |
| **React**        | 18.3+ | UI 框架  | https://react.dev          |
| **TypeScript**   | 5.0+  | 类型安全 | https://typescriptlang.org |
| **Vite**         | 6.0+  | 构建工具 | https://vite.dev           |
| **Tailwind CSS** | 3.4+  | 样式框架 | https://tailwindcss.com    |

### 状态管理 & 路由

| 库               | 用途                        |
| ---------------- | --------------------------- |
| **Zustand**      | 轻量级状态管理 (替代 Redux) |
| **React Router** | 客户端路由                  |

### UI 增强

| 库                          | 用途                        |
| --------------------------- | --------------------------- |
| **Framer Motion**           | 动画库 (页面过渡、卡片翻转) |
| **Lucide React**            | 图标库 (现代简约风格)       |
| **@amap/amap-jsapi-loader** | 高德地图加载器              |

### 工具库

| 库         | 用途                   |
| ---------- | ---------------------- |
| **Axios**  | HTTP 请求 (支持拦截器) |
| **Day.js** | 日期处理 (轻量级)      |
| **Zod**    | 数据校验               |

---

## 🚀 后端技术栈

### 核心框架

| 技术           | 版本  | 用途                        |
| -------------- | ----- | --------------------------- |
| **NestJS**     | 10.0+ | 企业级 Node.js 框架         |
| **Prisma**     | 5.0+  | ORM (类型安全的数据库操作)  |
| **PostgreSQL** | 15+   | 关系型数据库                |
| **Redis**      | 7.0+  | 缓存 (API 结果、对话上下文) |

### API 集成

| 服务             | 用途               | 备注              |
| ---------------- | ------------------ | ----------------- |
| **阿里通义千问** | AI 对话生成        | 使用 SSE 流式输出 |
| **高德地图 API** | POI 搜索、路径规划 | Web 服务 API      |
| **携程 API**     | 酒店数据           | 备选: Mock 数据   |
| **大众点评 API** | 美食推荐           | 备选: 公开数据集  |

---

## 🗄️ 数据库设计 (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户表 (可选，如果不需要登录可以删除)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  trips     Trip[]
}

// 旅行计划表
model Trip {
  id          String   @id @default(cuid())
  userId      String?  // 可为空 (匿名用户)
  user        User?    @relation(fields: [userId], references: [id])

  // 基本信息
  destination String   // 目的地城市
  startDate   DateTime // 开始日期
  endDate     DateTime // 结束日期
  budget      Float    // 预算 (元)
  peopleCount Int      @default(1) // 出行人数

  // 行程数据 (存储为 JSON)
  itinerary   Json     // 完整行程详情
  preferences Json?    // 用户偏好 (兴趣标签等)

  // 状态
  status      String   @default("draft") // draft / confirmed / completed

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  chatHistory ChatMessage[]
}

// 对话历史表
model ChatMessage {
  id        String   @id @default(cuid())
  tripId    String
  trip      Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)

  role      String   // "user" / "assistant"
  content   String   @db.Text
  timestamp DateTime @default(now())

  @@index([tripId])
}

// 景点缓存表 (可选，减少 API 调用)
model Attraction {
  id          String   @id @default(cuid())
  amapId      String   @unique // 高德 POI ID
  name        String
  city        String
  category    String   // 类型 (景点/餐厅/酒店)
  location    Json     // {lat, lng}
  address     String?
  rating      Float?
  price       Float?   // 门票/人均消费
  photos      String[] // 图片 URLs
  description String?  @db.Text

  cachedAt    DateTime @default(now())

  @@index([city, category])
}
```

### 数据库迁移命令

```bash
# 创建迁移
npx prisma migrate dev --name init

# 生成 Prisma Client
npx prisma generate

# 查看数据库
npx prisma studio
```

---

## 🎨 设计系统 (Tailwind 配置)

### 色彩方案

```js
// tailwind.config.js
module.exports = {
	theme: {
		extend: {
			colors: {
				// 主色调
				primary: {
					50: '#E6F9F7',
					100: '#B3EDE7',
					500: '#4ECDC4', // 薄荷绿
					600: '#3DB9B0',
					700: '#2C9B93',
				},
				secondary: {
					500: '#45B7D1', // 天空蓝
				},
				accent: {
					yellow: '#FFE66D', // 淡黄 (强调按钮)
					coral: '#FF6B6B', // 珊瑚粉 (警告提示)
				},
				// 中性色
				neutral: {
					50: '#F7F9FC', // 背景白
					100: '#E8F4F8', // 淡蓝背景
					700: '#2C3E50', // 深灰文字
				},
			},
			fontFamily: {
				sans: ['Inter', 'PingFang SC', 'sans-serif'],
				display: ['Poppins', 'Source Han Sans', 'sans-serif'],
			},
			boxShadow: {
				card: '0 4px 20px rgba(78, 205, 196, 0.15)',
				'card-hover': '0 8px 30px rgba(78, 205, 196, 0.25)',
			},
		},
	},
}
```

### 常用动画

```css
/* 打字机效果 */
@keyframes typing {
	from {
		width: 0;
	}
	to {
		width: 100%;
	}
}

/* 卡片悬浮 */
.card-hover-effect {
	@apply transition-all duration-300;
	@apply hover:shadow-card-hover hover:-translate-y-1;
}

/* 路径绘制动画 */
@keyframes draw-path {
	to {
		stroke-dashoffset: 0;
	}
}
```

---

## 🔌 API 集成详情

### 1. 阿里通义千问 API

**文档**: https://help.aliyun.com/zh/dashscope/

**请求示例** (SSE 流式输出):

```typescript
// backend/src/modules/ai/qwen.service.ts
async *streamChat(messages: ChatMessage[]) {
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({
      model: 'qwen-max',
      input: { messages },
      parameters: {
        result_format: 'message',
        incremental_output: true, // 流式输出
      }
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}
```

### 2. 高德地图 API

**文档**: https://lbs.amap.com/api/webservice/summary

**常用接口**:

```typescript
// POI 搜索
GET https://restapi.amap.com/v3/place/text?
  key={KEY}&
  keywords=美食&
  city=杭州&
  offset=20

// 路径规划
GET https://restapi.amap.com/v5/direction/driving?
  key={KEY}&
  origin=116.481028,39.989643&
  destination=116.465302,40.004717
```

---

## 🔐 环境变量配置

### 后端 `.env`

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/travelgenie?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# API Keys
QWEN_API_KEY="sk-xxxxxxxxxxxxxxxx"
AMAP_API_KEY="xxxxxxxxxxxxxxxx"
CTRIP_API_KEY="xxxxxxxxxxxxxxxx"  # 可选
DIANPING_API_KEY="xxxxxxxxxxxxx"  # 可选

# 服务配置
PORT=3001
NODE_ENV=development
```

### 前端 `.env`

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_AMAP_KEY=xxxxxxxxxxxxxxxx
```

---

## 📝 核心架构决策 (ADR)

### ADR-001: 为什么选择 NestJS 而非 Go?

**日期**: 2026-01-15  
**决策**: 使用 NestJS 作为后端框架

**理由**:

1. **全栈 TypeScript 统一**: 前后端共享类型定义，减少沟通成本
2. **开发速度**: 快速迭代 MVP，NestJS 生态更成熟
3. **WebSocket 支持**: SSE/WebSocket 集成简单 (AI 流式输出)
4. **团队技能**: 假设团队更熟悉 Node.js 生态

**备选方案**:

- 如果性能成为瓶颈 (日活 > 100 万)，可以用 Go 重构核心 API
- 保留 NestJS 作为 BFF (Backend For Frontend)

---

### ADR-002: 为什么选择 Zustand 而非 Redux?

**日期**: 2026-01-15  
**决策**: 使用 Zustand 作为状态管理

**理由**:

1. **轻量级**: 仅 ~1KB，Redux Toolkit ~10KB
2. **API 简洁**: 无需 reducer/action/dispatch 样板代码
3. **TypeScript 友好**: 开箱即用的类型推导
4. **足够灵活**: 支持中间件、持久化、DevTools

**示例**:

```typescript
// store/tripStore.ts
import { create } from 'zustand'

interface TripState {
	destination: string
	budget: number
	setDestination: (dest: string) => void
}

export const useTripStore = create<TripState>((set) => ({
	destination: '',
	budget: 0,
	setDestination: (dest) => set({ destination: dest }),
}))
```

---

## 🚀 本地开发流程

### 1. 安装依赖

```bash
# 前端
cd frontend
pnpm install

# 后端
cd backend
pnpm install
```

### 2. 启动服务

```bash
# 启动数据库 (使用 Docker)
docker-compose up -d postgres redis

# 运行数据库迁移
cd backend
npx prisma migrate dev

# 启动后端
pnpm run start:dev  # http://localhost:3001

# 启动前端
cd frontend
pnpm run dev  # http://localhost:5173
```

### 3. 常用命令

```bash
# 前端
pnpm run dev       # 开发服务器
pnpm run build     # 生产构建
pnpm run preview   # 预览生产版本

# 后端
pnpm run start:dev  # 开发模式 (热重载)
pnpm run test       # 运行测试
pnpm run lint       # 代码检查
```

---

## 📚 参考资料

- [React 官方文档](https://react.dev)
- [NestJS 官方文档](https://docs.nestjs.com)
- [Prisma 文档](https://www.prisma.io/docs)
- [通义千问 API 文档](https://help.aliyun.com/zh/dashscope/)
- [高德地图 API 文档](https://lbs.amap.com/api/webservice/summary)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

**最后更新**: 2026-01-15  
**维护者**: Antigravity AI
