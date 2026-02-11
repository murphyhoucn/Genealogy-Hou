# pure-genealogy 部署指南

本文档详细说明如何部署 pure-genealogy 应用并供外部用户访问。

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
cd d:\DevProj\Family-Hou\pure-genealogy
git init
git add .
git commit -m "Initial commit"
```

#### 2. 推送到 GitHub
```bash
# 在 GitHub 创建新仓库（如 Family-Hou/pure-genealogy）
git remote add origin https://github.com/YOUR_USERNAME/pure-genealogy.git
git branch -M main
git push -u origin main
```

#### 3. 连接 Vercel
- 访问 [vercel.com](https://vercel.com)
- 用 GitHub 账户登录
- 点击 "Add New... → Project"
- 选择仓库 `pure-genealogy`
- 配置环境变量：
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
  ```
- 点击 "Deploy"

#### 4. 自动化更新
- 每次 `git push main` 后，Vercel 自动构建和部署
- 生成的访问 URL：`https://your-project.vercel.app`

#### 5. 绑定自定义域名（可选）
- 在 Vercel 项目设置 → Domains
- 添加你的域名（如 `genealogy.example.com`）
- 按提示配置 DNS 记录

---

## 方案二：Railway（成本低、易管理）

### 优点
- 简单易用，国内可访问
- 按使用量收费
- 自动 HTTPS
- 支持环境变量

### 步骤

#### 1. 推送代码到 GitHub（同方案一）

#### 2. 连接 Railway
- 访问 [railway.app](https://railway.app)
- 用 GitHub 登录
- 创建新项目 → "Deploy from GitHub"
- 选择仓库
- 配置环境变量：
  ```
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ```

#### 3. 配置启动命令
- 在 Railway 项目设置中：
  - Build Command: `npm run build`
  - Start Command: `npm start`
  - Port: `3000`

#### 4. 获取访问 URL
- Railway 自动分配 URL（如 `https://pure-genealogy-prod.up.railway.app`）
- 或绑定自定义域名

---

## 方案三：自主服务器部署（VPS/云服务器）

### 适用场景
- 需要完全控制
- 在线用户较多（>1000/天）
- 需要自定义配置

### 步骤

#### 1. 准备服务器
推荐：
- AWS EC2（t3.small 或更高）
- DigitalOcean（$6/月起）
- Linode、Vultr 等

系统要求：
- Ubuntu 20.04 LTS 或更高
- 2GB RAM + 20GB 硬盘

#### 2. 环境安装
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js (v20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证版本
node --version  # v20.x.x
npm --version   # 10.x.x

# 安装 Git
sudo apt install -y git

# 安装 PM2（进程管理）
sudo npm install -g pm2
```

#### 3. 部署应用
```bash
# 克隆仓库
cd /opt
sudo git clone https://github.com/YOUR_USERNAME/pure-genealogy.git
cd pure-genealogy

# 创建 .env.local（填入 Supabase 凭证）
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
EOF

# 安装依赖
npm ci --omit=dev  # 生产环境不装 dev 依赖

# 构建应用
npm run build

# 启动应用（使用 PM2）
pm2 start npm --name "pure-genealogy" -- start
pm2 startup
pm2 save  # 开机自启动
```

#### 4. Nginx 反向代理
```bash
sudo apt install -y nginx

# 创建配置
sudo tee /etc/nginx/sites-available/genealogy > /dev/null << 'EOF'
server {
  listen 80;
  server_name genealogy.example.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/genealogy /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

#### 5. SSL 证书（Let's Encrypt）
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d genealogy.example.com
```

#### 6. 定时更新
```bash
# 创建更新脚本
cat > /opt/deploy.sh << 'EOF'
#!/bin/bash
cd /opt/pure-genealogy
git pull origin main
npm ci --omit=dev
npm run build
pm2 restart pure-genealogy
EOF

chmod +x /opt/deploy.sh

# 添加到 cron（每 6 小时检查更新）
(crontab -l 2>/dev/null; echo "0 */6 * * * /opt/deploy.sh") | crontab -
```

---

## 方案四：Docker 容器化部署

### 创建 Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 运行阶段
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV NODE_ENV production
CMD ["npm", "start"]
```

### 构建和运行
```bash
# 构建镜像
docker build -t pure-genealogy:latest .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key \
  --name genealogy-app \
  pure-genealogy:latest
```

### Docker Compose（推荐）
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${SUPABASE_KEY}
    restart: unless-stopped
```

运行：
```bash
docker-compose up -d
```

---

## 性能优化清单

部署前确保：

### 1. 产物优化
```bash
# 检查构建产物大小
npm run build

# 确认 .next/static 大小合理（通常 <5MB）
```

### 2. 缓存策略
- `next.config.ts` 已设置 `cacheComponents: true`
- CDN 自动缓存静态资源

### 3. 数据库连接
- Supabase 自动管理连接池
- Server Actions 复用连接

### 4. 安全检查
- [ ] `.env.local` 不提交到 Git
- [ ] `.gitignore` 包含敏感文件
- [ ] Supabase RLS（行级安全）已启用
- [ ] API 密钥权限最小化

### 5. 监控告警
```bash
# 如使用 Vercel，在控制面板启用：
# - Function logs
# - Analytics
# - Real-time alerts
```

---

## 环境变量配置

### 必需（生产环境）
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJxxxxxxxxxx
```

### 可选
```
NEXT_PUBLIC_SITE_URL=https://genealogy.example.com
NODE_ENV=production
```

**注意**：`NEXT_PUBLIC_*` 前缀表示客户端可访问，不要存放密钥或敏感信息。

---

## 故障排查

### 构建失败
```bash
# 清空缓存重新构建
rm -rf .next node_modules
npm install
npm run build
```

### 白屏或 404
- 检查环境变量是否正确
- 浏览器控制台查看报错
- 检查 Supabase 网络连接

### 用户无法登录
- 确认 Supabase Auth 配置了重定向 URL
- 检查 CORS 设置
- 查看 Supabase 日志

### 超时/慢查询
- 数据库查询优化（索引、分页）
- 启用 Supabase 缓存
- 减少 API 调用

---

## 发布清单

部署前：
- [ ] 所有功能测试通过
- [ ] 无 TypeScript 错误
- [ ] 无浏览器控制台警告
- [ ] .env.local 不在 Git 中
- [ ] 数据库迁移已执行
- [ ] UI 在手机上可用

部署后：
- [ ] 访问 URL 可正常打开
- [ ] 可以注册和登录
- [ ] 数据导入功能正常
- [ ] 图表和可视化正常加载
- [ ] 响应时间 < 2 秒

---

## 推荐配置总结

| 方案 | 成本 | 易用度 | 扩展性 | 国内访问 |
|------|------|--------|--------|----------|
| Vercel | 免费~$20/月 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 一般 |
| Railway | 免费~$50/月 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 良好 |
| VPS 自行部署 | $5~20/月 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 优秀 |
| Docker | 取决于平台 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | - |

**首次推荐**：Vercel（最快上线）或 Railway（国内友好）  
**长期运营**：VPS 自行部署或 Docker（成本低、控制全）

---

## 后续维护

### 定期更新依赖
```bash
npm outdated  # 检查可更新的包
npm update    # 安全更新
npm audit fix # 修复安全问题
```

### 性能监控
- 使用 Vercel Analytics 或 Web Vitals
- 定期检查 Supabase 存储容量
- 监控用户增长和服务稳定性

### 备份策略
- Supabase 自动备份数据库（免费 7 天版本保留）
- 升级到付费计划获得 30 天备份
- 定期导出用户数据到 Excel

---

**需要帮助？** 查看 [Vercel 文档](https://vercel.com/docs) 或 [Railway 文档](https://docs.railway.app)
