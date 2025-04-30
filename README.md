# 微信编辑器

基于Next.js + Tailwind CSS + Shadcn/UI的微信编辑器项目，支持多平台模板互通。

## 功能特点

- 支持多平台模板互通（135编辑器、96编辑器、秀米、公众号）
- 现代化UI界面，支持响应式设计
- 基于React和TypeScript开发
- 使用Tailwind CSS进行样式设计
- 组件库基于Shadcn/UI 

## 技术栈

- [Next.js](https://nextjs.org/) - React框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Shadcn/UI](https://ui.shadcn.com/) - 可复用UI组件库
- [TypeScript](https://www.typescriptlang.org/) - 类型检查
- [PNPM](https://pnpm.io/) - 包管理工具

## 开始使用

1. 克隆项目

```bash
git clone https://your-repository-url.git
cd wx-editor
```

2. 安装依赖

```bash
pnpm install
```

3. 启动开发服务器

```bash
pnpm dev
```

4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 项目页面

- 首页：显示项目概述和功能导航
- 模板选择页：用于选择和提取不同平台的模板

## 添加更多Shadcn/UI组件

```bash
pnpm dlx shadcn@latest add [component-name]
```

例如：

```bash
pnpm dlx shadcn@latest add dialog dropdown-menu
```

## 构建生产版本

```bash
pnpm build
```

## 启动生产服务器

```bash
pnpm start
```

## 许可证

MIT
# wx-scraper
获取135编辑器 96编辑器模版 提示

# 项目数据库设置指南

## Prisma 数据库设置

本项目使用 Prisma ORM 来操作 PostgreSQL 数据库。以下是完整的设置步骤：

### 1. 安装依赖

已经安装了以下依赖：
- `prisma@4.16.2`（开发依赖）
- `@prisma/client`（运行时依赖）

### 2. 配置数据库连接

打开 `.env` 文件，修改 `DATABASE_URL` 环境变量：

```
DATABASE_URL="postgresql://用户名:密码@localhost:5432/数据库名?schema=public"
```

请将 `用户名`、`密码` 和 `数据库名` 替换为实际的 PostgreSQL 数据库信息。

### 3. 创建数据库（如果尚未创建）

使用 PostgreSQL 客户端或命令行工具创建数据库：

```bash
psql -U postgres
CREATE DATABASE 你的数据库名;
```

### 4. 运行数据库迁移

初始化数据库结构：

```bash
npx prisma migrate dev --name init
```

这将创建所有数据表并生成 Prisma 客户端。

### 5. 生成 Prisma 客户端（如果需要更新）

每当更改 Prisma 模型后，都需要重新生成客户端：

```bash
npx prisma generate
```

## 数据模型

本项目包含以下数据模型：

1. **User** - 用户信息
   - 字段：id, account, name, avatar, status, role
   - 关系：templates, shares

2. **Template** - 模板信息
   - 字段：id, title, content, templateId, type, authorId
   - 关系：author, shares
  
3. **Share** - 分享记录
   - 字段：id, templateId, userId, status
   - 关系：template, user

## API 端点

API 路由位于 `src/app/api` 目录下：

1. **用户 API** - `/api/users`
   - GET：获取所有用户
   - POST：创建新用户

2. **模板 API** - `/api/templates`
   - GET：获取模板列表，支持按类型和作者筛选
   - POST：创建新模板

3. **分享 API** - `/api/shares`
   - GET：获取分享记录，支持按用户和模板筛选
   - POST：创建新的分享记录

## Prisma Studio

Prisma 提供了一个可视化工具 Prisma Studio，用于查看和管理数据库：

```bash
npx prisma studio
```

运行后，在浏览器中访问 http://localhost:5555 即可。
