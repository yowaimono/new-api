# 部署与品牌配置

本站点（妙云AI）基于上游 `new-api` 部署，本目录保存**不随源码走、但需要版本控制**的部署侧配置。

```
deploy/
├── brand/
│   ├── branding.json       品牌配置项（写入 New-API options 表）
│   ├── apply-branding.sh   把 branding.json 应用到位（走官方 API）
│   ├── logo.png            部署用 logo（1:1 / 透明底 / 256x256）
│   ├── process-logo.py     由原始素材重新生成 logo.png
│   └── caddy-brand.conf    Caddy 静态路由片段，用于对外提供 logo
└── compose/
    ├── docker-compose.yml  生产部署编排（脱敏模板）
    └── .env.example        环境变量模板，复制为 .env 后填值
```

## 品牌配置

| 配置项 | 值 |
| --- | --- |
| `SystemName` | `妙云AI` |
| `Logo` | `https://ai.kyeai.xyz/brand/logo-1x1.png` |

这两项存在数据库 `options` 表里，通过 New-API 的 `PUT /api/option/` 接口写入，**不需要改动任何源码**。

## 应用步骤

1. **上传 logo**：把 `logo.png` 放到 Caddy 的静态目录并按要求命名

   ```bash
   cp logo.png /opt/new-api-custom/caddy/www/brand/logo-1x1.png
   ```

2. **加 Caddy 路由**：把 `caddy-brand.conf` 的内容插入 `Caddyfile` 中 `ai.kyeai.xyz` 块的兜底 `handle { }` 之前，然后校验并优雅重载（不会中断其它站点）

   ```bash
   docker exec caddy caddy validate --config /etc/caddy/Caddyfile
   docker exec caddy caddy reload   --config /etc/caddy/Caddyfile
   ```

3. **写入配置**

   ```bash
   ADMIN_PASS='管理员密码' ./apply-branding.sh
   ```

4. 浏览器 `Ctrl+F5` 强制刷新（前端会缓存旧品牌）。

校验 logo 是否可访问：

```bash
curl -sS -o /dev/null -w '%{http_code} %{content_type} %{size_download}\n' \
  https://ai.kyeai.xyz/brand/logo-1x1.png
```

## 为什么 logo 必须是 1:1 且透明底

**必须 1:1**：New-API 前端的 logo 槽位全部是正方形容器，其中两处用 `object-cover` 并带 `overflow-hidden`
（`web/src/components/layout/components/system-brand.tsx` 的 sidebar `size-8` 与 inline `size-5`）。
非 1:1 的图在这些槽位里会被裁掉两侧，而不是等比缩放。

**必须透明底**：否则深色主题下 logo 会显示成一块白色方块。

**尺寸**：实际最大渲染尺寸为 32px（sidebar），256x256 已留有充足余量，同时文件仅约 19 KB。

## 重新生成 logo

原始素材不在本仓库中（体积较大）。拿到素材后：

```bash
python3 process-logo.py <原始素材.png> logo.png
```

脚本会依次完成：按合成模型反解 alpha（避免抗锯齿白边）、以墨迹包围盒中心裁出 1:1、缩放到 256x256。
详见 `process-logo.py` 顶部注释。

## 生产 compose

`compose/docker-compose.yml` 是线上编排的**脱敏模板**，与运行态一致，但有三处刻意修正（文件末尾有详细说明）：

1. 密钥改为 `.env` 注入，不再明文写死。
2. **修正了 redis 的 `command`** —— 原文件的 command 是一段被拆散的字符串碎片
   （`"[redis-server,"`、`"--requirepass,"`、`"${REDIS_PASSWORD}]"`），redis 会把
   `[redis-server,` 当作配置文件路径，**重建容器时必然启动失败**。线上之所以还活着，
   是因为运行中的容器创建于 2026-05-11，用的是正确的命令，之后没人重建过它。
3. 去掉了 redis / postgres 的 `container_name` —— 线上这两个容器实际名为
   `2fa9b3d24e4e_opc-new-api-redis` / `a98bd6a0b3e1_opc-new-api-postgres`，
   说明 `container_name` 是后加的。compose 靠 `com.docker.compose.project/service`
   标签识别容器，与名字无关；一旦补上 `container_name`，compose 会认为容器不存在而新建重复实例。

### 应用方式

```bash
cp .env.example .env && vi .env      # 填入真实密钥

# 全量（首次部署或需要重建依赖时）
docker-compose -f docker-compose.yml up -d

# 仅重建 new-api —— 最常用，不动 redis/postgres
docker-compose -f docker-compose.yml up -d --no-deps new-api
```

> 本机只装了 `docker-compose` v1.29.2，**没有** `docker compose` v2 插件，命令必须用连字符形式。

### 数据卷

postgres 数据在命名卷 `new-api-custom_opc_new_api_pg_data`（compose 项目名前缀 +
`opc_new_api_pg_data`）。重建 postgres 容器不会丢数据，但**不要同时运行两个挂载该卷的
postgres 实例**，第二个会因数据目录被占用而起不来，并额外抢注 `postgres` 这个 DNS 别名。

### 已知的运行态偏差

线上 redis 实际只跑 `redis-server --requirepass <pw>`，模板中的
`--maxmemory 48mb --maxmemory-policy allkeys-lru` **尚未生效**。当前若内存被撑满，
容器会被 `mem_limit 48m` 直接 OOM 杀掉，而不是按 LRU 淘汰。要让模板意图生效需重建
redis 容器，届时会短暂断开缓存连接（new-api 会自行重连）。

## 注意

- 管理员密码、数据库密码、`SESSION_SECRET` 一律不落盘、不进仓库。
- `compose/.env` 已被 `.gitignore` 第 16 行的 `.env` 规则覆盖。
