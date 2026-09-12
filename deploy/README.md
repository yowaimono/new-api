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
├── compose/
│   ├── docker-compose.yml  生产部署编排（脱敏模板）
│   └── .env.example        环境变量模板，复制为 .env 后填值
└── pricing/
    ├── model-pricing.json  模型定价（含时段分档计费表达式）
    └── apply-pricing.sh    把定价写入到位（走官方 model_pricing 接口）
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

### ⚠️ compose v1 无法重建容器（重要）

线上 Docker Engine 是 **28.2.2**，其 image inspect 已不再返回 `ContainerConfig` 字段；
而 `docker-compose` v1.29.2 仍在读这个字段，**任何容器重建都会失败**：

```
KeyError: 'ContainerConfig'   # compose/service.py: get_container_data_volumes
```

危险之处在于 compose 的执行顺序是**先停掉旧容器、再创建新容器**。失败后旧容器已被停掉，
新容器又没建起来 —— 等于直接把服务打挂。2026-09-12 就因此中断过一次 redis，
站点返回 500，靠 `docker start <旧容器>` 才恢复。

**因此：在这台机器上不要用 compose 重建任何容器**，包括 `up -d`、`--force-recreate`、
`restart` 之外的操作。重建只能改用 `docker run`（保留原 network / mem_limit / restart /
compose 标签），或者先装 compose v2。

### redis maxmemory 的现状

模板中 redis 命令带 `--maxmemory 40mb --maxmemory-policy allkeys-lru`，
取 40mb 而不是等于 `mem_limit` 的 48m，是为了给客户端缓冲等非数据集内存留余量。

线上容器创建于 2026-05-11，命令里**没有**这两项，且因上述 compose 缺陷无法重建。
2026-09-12 已用运行时配置补上（重启容器即失效）：

```bash
docker exec <redis容器> redis-cli -a "$PW" --no-auth-warning config set maxmemory 40mb
docker exec <redis容器> redis-cli -a "$PW" --no-auth-warning config set maxmemory-policy allkeys-lru
```

实际风险很低：当时 redis 仅用 1.72 MB（9 个键），距 48 MB 上限极远。
待容器下次因正当原因重建时，模板中的参数会自动生效。

## 模型定价

定价文件 `pricing/model-pricing.json`，应用方式：

```bash
ADMIN_PASS='管理员密码' ./pricing/apply-pricing.sh
```

### 为什么必须显式配置

new-api 对**未配置定价的模型**不会报错，而是静默套用硬编码兜底值
（`setting/ratio_setting/model_ratio.go` 的 `GetModelRatio` 返回 `37.5`）。
按 `QuotaPerUnit = 500000`（ratio 1 = $0.002/1K = $2/1M tokens）换算，
**37.5 相当于 $75/1M tokens** —— 是真实成本的几十倍。

前端只看「有没有可用渠道」，有渠道就展示，完全不校验价格是否合理。
因此「有分组、有模型、看起来正常」并不代表价格配好了。

### 为什么用 model_pricing 专用接口

`PUT /api/option/` 写 `ModelRatio` 是**整表替换**，只写几个模型会把其余内置定价
全部抹掉、一并退回 37.5 兜底。`PATCH /api/option/model_pricing` 是按模型合并，
只影响指定模型（实测：写入 5 个模型后 `ModelRatio` 从 235 条增至 240 条，
其余定价完好）。

⚠️ 但**单个模型的 `pricing` 是整体替换语义** —— 改任何一个字段都必须把该模型的
全部字段一起传，否则未传的字段会被清空。

### 计价口径

系数直接复制自上游 `tbtk.asia` 的 `/api/pricing`，采用其**时段分档表达式**
（rc.36 的 `billing_mode = tiered_expr`）。表达式系数即**美元/1M tokens**，
最终 `quota = 表达式输出 / 1e6 × QuotaPerUnit × 分组倍率`。

| 模型 | 时段 | 输入 $/1M | 输出 $/1M | 缓存读 $/1M |
| --- | --- | --- | --- | --- |
| deepseek-v4-flash / -0731 / -vision-exp | 高峰 | 3.00 | 9.00 | 0.10 |
| 同上 | 低谷 | 1.50 | 4.50 | 0.05 |
| deepseek-v4-pro | 高峰 | 9.00 | 27.00 | 0.30 |
| deepseek-v4-pro | 低谷 | 4.50 | 13.50 | 0.15 |
| deepseek-v4.1-flash | 高峰 | 2.00 | 8.00 | 0.04 |
| deepseek-v4.1-flash | 低谷 | 1.00 | 4.00 | 0.02 |

高峰 = 周一至周五 09:00–12:00 与 14:00–18:00（Asia/Shanghai），其余为低谷
（低谷约为全周的 79%）。

### 利润来源

上游这 5 个模型挂在 `低价国模分组`，其 `group_ratio = 0.5` —— **这就是我们的成本**。
我方 `国模低价` 分组倍率为 **0.55**，两者之差 **0.05 即毛利**（约 10%）。

若把 `国模低价` 调到 0.55 以下就会亏本；`default` 分组倍率为 1，毛利率约 100%。

### 验证记录

2026-09-12 端到端实测（真实请求 + 查日志核对）：

```
deepseek-v4-flash  输入 33 / 输出 8 / 无缓存命中 / 低谷时段
表达式        33×1.5 + 8×4.5 = 85.5
预期扣费      85.5 / 1e6 × 500000 × 0.55 = 23.51 quota
实际扣费      24 quota（取整差）
若按旧兜底价  846 quota（相差 36 倍）
```

### 已知的模型名变更

上游 DeepSeek 官方已将 `deepseek-v4-flash` 与 `deepseek-v4-flash-vision-exp`
**标记为退役**，请求实际由 V4.1-Flash 承接并以 Flash 价计费（实测调用返回的
`model` 字段为 `deepseek-flash`）。当前渠道仍沿用旧名，价格按上游口径配置。

## 注意

- 管理员密码、数据库密码、`SESSION_SECRET` 一律不落盘、不进仓库。
- `compose/.env` 已被 `.gitignore` 第 16 行的 `.env` 规则覆盖。
