# Mantis Photography · 摄影作品集

基于 Next.js 15 与 Tailwind CSS 的极简摄影作品集网站。

## 功能

- **首页**：大图轮播 + 简短介绍与入口
- **作品**：瀑布流布局照片墙（CSS columns）
- **关于**：关于我页面

## 环境要求

- Node.js 18+
- npm / pnpm / yarn

## 安装与运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)。

## 项目结构

```
src/
├── app/
│   ├── layout.tsx      # 根布局与导航
│   ├── page.tsx        # 首页（轮播）
│   ├── globals.css
│   ├── gallery/
│   │   └── page.tsx    # 作品瀑布流
│   └── about/
│       └── page.tsx    # 关于我
└── components/
    ├── Nav.tsx         # 顶部导航
    └── ImageCarousel.tsx  # 首页轮播组件
```

## 构建与部署

```bash
npm run build
npm start
```

## 自定义

- 首页轮播图：编辑 `src/components/ImageCarousel.tsx` 中的 `slides` 数组
- 作品墙图片：编辑 `src/app/gallery/page.tsx` 中的 `photos` 数组
- 关于内容：编辑 `src/app/about/page.tsx`
- 样式与主题：修改 `src/app/globals.css` 中的 CSS 变量与 `tailwind.config.ts`

当前使用 Unsplash 示例图，正式使用时可替换为本地图片（放入 `public/` 并改用 `/xxx.jpg`）或自己的图床地址。
