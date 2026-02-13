# 族谱管理系统

> 基于 Next.js 16 和 Supabase 的现代化家族族谱管理系统
> 
> forked from: [pure-genealogy](https://github.com/yunfengsa/pure-genealogy)

## ✨ 核心功能

- 📋 **成员管理** - 增删改查、批量导入导出(yaml/yml/xls/xlsx)、富文本生平编辑
- 📊 **可视化** - 2D/3D 族谱图、统计仪表盘、历史时间轴
- 🔐 **用户认证** - 支持访客访问，支持注册（邀请码），Supabase Auth 完整认证流程
- 📱 **响应式** - 支持桌面端和移动端

## 🛠️ 技术栈

- **前端**: Next.js 16 + React 19 + TypeScript
- **后端**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: Tailwind CSS + shadcn/ui
- **可视化**: React Flow + Force Graph 3D + Recharts

## 🚀 快速开始

`ash
# 1. 克隆项目
``` bash
git clone https://github.com/murphyhoucn/Genealogy-Hou
cd Genealogy-Hou
```

# 2. 安装依赖
``` bash
npm install
```


# 3. 配置环境变量
``` bash
# 新建 .env.local 文件并填入 Supabase 配置

# Update these with your Supabase details from your project settings > API
# https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=Supabase_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=Anon_Key

# 家族姓氏配置
NEXT_PUBLIC_FAMILY_SURNAME="Family_Name"

# 注册邀请码（多个邀请码用逗号分隔）
REGISTRATION_INVITE_CODES="xxxxxx,yyyyyy,zzzzzz"
```

# 4. 启动开发服务器
``` bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

数据库表结构详见 .github/family_members.sql

## 📄 许可证

MIT License


# 部署指南

## 📋 前置要求

- Node.js 18.17+ 和 npm 9+
- Supabase 账户和项目（已配置数据库）
- 域名或子域名（可选，如需 SSL 证书）
- 部署平台账户：Vercel（推荐）/ Railway / Netlify 等

---

## 方案一：Vercel （推荐 - 最简单）

### 优点
- Next.js 官方推荐
- 冷启动快，自动扩展
- 免费 SSL 证书
- CI/CD 自动化
- 性能最优化

### 步骤

#### 1. 准备代码
```bash
git init
git add .
git commit -m "Initial commit"
```

#### 2. 推送到 GitHub
```bash
git push -u origin main
```

#### 3. 连接 Vercel
- 访问 [vercel.com](https://vercel.com)
- 用 GitHub 账户登录
- 点击 "Add New... → Project"
- 选择仓库 `Genealogy-Hou`
- 配置环境变量：
``` bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key

……
```
- 点击 "Deploy"

#### 4. 自动化更新
- 每次 `git push main` 后，Vercel 自动构建和部署
- 生成的访问 URL：`https://your-project.vercel.app`

#### 5. 绑定自定义域名（可选）
- 在 Vercel 项目设置 → Domains
- 添加你的域名（如 `genealogy.example.com`）
- 按提示配置 DNS 记录