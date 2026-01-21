# 智能旅游规划应用 - 需求文档

## 项目概述

基于阿里通义千问 AI 的智能旅游规划应用，通过对话式交互帮助用户生成个性化旅行方案。

## 当前 Sprint / 活动上下文

### Phase 1: 项目架构与环境搭建

- [x] 初始化项目结构（Monorepo）
- [x] 配置后端 NestJS 项目
- [x] 配置前端 React + Vite 项目
- [x] 集成阿里通义千问 API

### Phase 2: 后端核心功能

- [x] 实现 Chat Module（对话管理）
- [x] 实现 Travel Module（方案生成）
- [x] 配置 TypeORM + SQLite 数据库
- [x] 创建数据模型（Conversation, Message, TravelPlan）
- [x] 实现 RESTful API 端点
- [x] 实现流式响应支持（SSE）

### Phase 3: 前端 UI 开发

- [x] 设计配色系统和设计 tokens
- [x] 实现聊天界面组件
  - [x] 消息列表
  - [x] 输入框
  - [x] 消息气泡（用户/AI）
  - [x] 打字效果动画
- [x] 实现旅行方案展示组件
  - [x] 行程卡片
  - [x] 景点列表
  - [x] 预算明细
- [x] 实现历史记录功能
- [x] 响应式设计（移动端/桌面端）

### Phase 4: 集成与优化

- [x] 前后端 API 集成 (Verifying)
- [x] 错误处理与用户反馈
- [x] 性能优化
- [x] UI/UX 微调 (Profile Multi-select & Modal)
- [x] 智能上下文优化 (Departure City Auto-fill)
- [x] JSON Output Migration (Structured Data)

## 功能需求详细说明

### 核心功能

1. **对话式交互**
   - 用户通过自然语言描述旅行需求
   - AI 智能提问收集信息（目的地、时间、预算、偏好等）
   - 多轮对话上下文保持

2. **个性化旅行方案生成**
   - 预算管理（自动计算交通/餐饮/门票）
   - 实用贴士（天气/穿衣/必备品）
   - **增强真实性**: 集成实时天气，提供真实航班/酒店推荐 ✅

### 3. **方案管理**

- 保存生成的旅行方案
- 查看历史对话
- 导出方案（未来）
- **智能地图展示**: 自动为行程生成可交互的路线地图 ✅

### 技术需求

- **前端**: React 19, TypeScript, Vite
- **后端**: NestJS 10, TypeScript
- **AI**: 阿里通义千问 API
- **数据库**: TypeORM + SQLite
- **API**: RESTful + Server-Sent Events (流式响应)

### UI/UX 设计要求

- 高颜值、现代化设计
- 旅游主题配色（渐变、玻璃拟态）
- 流畅动画效果
- 响应式布局
- 无 placeholder，使用真实内容

## Backlog / 未来功能

- [x] 用户认证系统
- [ ] 多语言支持
- [x] 地图集成（展示路线）
- [x] 分享功能
- [x] PDF 导出
- [ ] 预算计算器
- [x] 天气预报集成

## 已完成历史

- [x] 需求分析与技术选型
- [x] 架构设计与规划
