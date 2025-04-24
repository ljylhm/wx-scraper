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
