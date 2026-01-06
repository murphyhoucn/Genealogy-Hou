# pure-genealogy 族谱管理系统

<p align="center">
  <img alt="pure-genealogy Tree" src="app/opengraph-image.png" width="800">
</p>

<p align="center">
  一个基于 Next.js 15 和 Supabase 构建的现代化、全中文家族族谱管理系统。
</p>

## ✨ 项目亮点

- **前沿技术栈**: 采用最新的 **Next.js 15** (App Router) 和 **React 19**。
- **全栈无服务**: 后端使用 **Supabase**，提供高性能数据库、身份认证及实时订阅功能。
- **深度中文化**: 针对中文语境深度定制，包括 UI 文案、日期格式、元数据及字辈统计。
- **多维可视化**:
  - **2D 树形图**: 基于 `@xyflow/react` 自动生成可交互的家族树。
  - **3D 关系网**: 基于 `react-force-graph-3d` 提供沉浸式的三维家族力导向图。
  - **家族统计**: 基于 `recharts` 提供性别比例、世代分布、年龄结构等多维数据分析。
  - **历史时间轴**: 直观展示家族成员的生卒年时间分布。
- **沉浸式体验**:
  - **"Living Book" 详情页**: 独创的 3D 翻书/画卷交互，背面展示生平事迹。
  - **富文本生平**: 集成 Slate.js 编辑器，支持排版精美的生平传记记录，具备逐字显现的艺术动效。

## 🛠️ 技术栈

- **框架**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **数据库 & 认证**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)
- **UI 组件库**: [shadcn/ui](https://ui.shadcn.com/) (基于 Radix UI)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **可视化**: 
  - [@xyflow/react](https://reactflow.dev/) (2D Graph)
  - [react-force-graph-3d](https://github.com/vasturiano/react-force-graph-3d) (3D Graph)
  - [recharts](https://recharts.org/) (Charts)
- **富文本**: [Slate.js](https://docs.slatejs.org/) (生平事迹编辑)
- **工具**: TypeScript, ESLint, Lucide React (图标)

## 🚀 主要功能

### 1. 核心管理 (`/family-tree`)
- **成员档案**: 记录姓名、字辈、父母、配偶、生卒年、居住地、官职等详细信息。
- **富文本生平**: 支持加粗、斜体等格式的生平事迹记录，前端展示支持“毛笔扫过”动效。
- **便捷操作**: 支持成员搜索、增删改查、以及 Excel/CSV 数据的批量导入导出。

### 2. 可视化视图
- **2D 族谱图 (`/family-tree/graph`)**: 自动布局的层级树状图，支持缩放、拖拽。
- **3D 力导向图 (`/family-tree/graph-3d`)**: 炫酷的 3D 星座图式展示，支持节点点击定位。
- **统计仪表盘 (`/family-tree/statistics`)**: 家族人口概览、性别比例、世代增长趋势、年龄分布图等。
- **时间轴 (`/family-tree/timeline`)**: 横向时间轴展示家族历史跨度。

### 3. 系统功能
- **安全认证**: 完整的注册、登录、密码重置流程 (Supabase Auth)。
- **实时同步**: 多端数据实时更新。
- **响应式设计**: 完美适配桌面端与移动端，支持明暗主题切换。

## 📦 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yunfengsa/pure-genealogy.git
cd pure-genealogy
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` (或新建) 为 `.env.local` 并填入 Supabase 项目配置：

```env
NEXT_PUBLIC_SUPABASE_URL=你的_Supabase_项目_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的_Supabase_Anon_Key
```

### 4. 初始化数据库

在 Supabase 项目的 SQL Editor 中执行以下脚本以创建核心表：

```sql
CREATE TABLE family_members (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    generation integer,
    sibling_order integer,
    father_id bigint REFERENCES family_members(id),
    gender text CHECK (gender IN ('男', '女')),
    official_position text,
    is_alive boolean DEFAULT true,
    spouse text,
    remarks text, -- 存储 Slate.js 富文本 JSON 数据
    birthday date,
    death_date date,
    residence_place text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 创建索引优化查询
CREATE INDEX idx_family_members_father_id ON family_members(father_id);
CREATE INDEX idx_family_members_name ON family_members(name);
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

## 📂 项目结构

```
/
├── app/                  # Next.js App Router 核心目录
│   ├── auth/             # 认证流程页面
│   ├── family-tree/      # 族谱主要功能区
│   │   ├── graph/        # 2D 视图
│   │   ├── graph-3d/     # 3D 视图
│   │   ├── statistics/   # 统计仪表盘
│   │   ├── timeline/     # 时间轴
│   │   └── page.tsx      # 成员列表
│   └── ...
├── components/           # React 组件
│   ├── ui/               # shadcn/ui 基础组件
│   ├── rich-text/        # Slate 富文本编辑器组件
│   └── ...
├── lib/                  # 工具函数与 Supabase 客户端配置
└── hooks/                # 自定义 Hooks
```

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。