# 部署与品牌配置

本站点（妙云AI）基于上游 `new-api` 部署，本目录保存**不随源码走、但需要版本控制**的部署侧配置。

```
deploy/
└── brand/
    ├── branding.json       品牌配置项（写入 New-API options 表）
    ├── apply-branding.sh   把 branding.json 应用到位（走官方 API）
    ├── logo.png            部署用 logo（1:1 / 透明底 / 256x256）
    ├── process-logo.py     由原始素材重新生成 logo.png
    └── caddy-brand.conf    Caddy 静态路由片段，用于对外提供 logo
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

## 注意

- 管理员密码不落盘、不进仓库，只通过 `ADMIN_PASS` 环境变量传入。
- `docker-compose.yml`、`.env` 等含密钥的部署文件不纳入本目录。
