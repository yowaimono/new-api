#!/usr/bin/env bash
# 将 branding.json 中的品牌配置写入 New-API（走官方 option 接口，不直接改库）。
#
# 用法:
#   ADMIN_PASS='管理员密码' ./apply-branding.sh
#   API_BASE=https://ai.kyeai.xyz ADMIN_USER=root ADMIN_PASS=xxx ./apply-branding.sh
#
# 前置条件:
#   1. logo.png 已放到 Caddy 的 www/brand/ 目录下并命名为 logo-1x1.png
#   2. /brand/* 路由已加入 Caddyfile（见 caddy-brand.conf）并已 reload
#
# 说明: 密码只经环境变量传入，不落盘、不进仓库。
set -euo pipefail

API_BASE="${API_BASE:-https://ai.kyeai.xyz}"
ADMIN_USER="${ADMIN_USER:-root}"
ADMIN_PASS="${ADMIN_PASS:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANDING_JSON="${BRANDING_JSON:-$SCRIPT_DIR/branding.json}"
LOGO_LOCAL="${LOGO_LOCAL:-$SCRIPT_DIR/logo.png}"
LOGO_REMOTE="${LOGO_REMOTE:-/opt/new-api-custom/caddy/www/brand/logo-1x1.png}"
LOGO_URL="${LOGO_URL:-$API_BASE/brand/logo-1x1.png}"

if [ -z "$ADMIN_PASS" ]; then
  echo "错误: 必须通过环境变量提供管理员密码 ADMIN_PASS" >&2
  exit 1
fi
command -v python3 >/dev/null || { echo "错误: 需要 python3" >&2; exit 1; }

# 若本机可写远端路径（即在目标服务器上执行），顺带同步 logo 文件并校验
if [ -w "$(dirname "$LOGO_REMOTE")" ] && [ -f "$LOGO_LOCAL" ]; then
  echo "同步 logo: $LOGO_LOCAL -> $LOGO_REMOTE"
  cp -f "$LOGO_LOCAL" "$LOGO_REMOTE"
  sha256sum "$LOGO_LOCAL" "$LOGO_REMOTE"
fi

echo "目标站点: $API_BASE"
API_BASE="$API_BASE" ADMIN_USER="$ADMIN_USER" ADMIN_PASS="$ADMIN_PASS" \
BRANDING_JSON="$BRANDING_JSON" LOGO_URL="$LOGO_URL" python3 - <<'PY'
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.request

base = os.environ["API_BASE"].rstrip("/")
branding_path = os.environ["BRANDING_JSON"]
logo_url = os.environ["LOGO_URL"]

opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def call(path, payload=None, token=None, method="POST"):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(base + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with opener.open(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as err:
        return json.loads(err.read().decode("utf-8", "replace"))


login = call("/api/user/login", {"username": os.environ["ADMIN_USER"], "password": os.environ["ADMIN_PASS"]})
if not login.get("success"):
    sys.exit("登录失败: %s" % login.get("message"))
token = login["data"]["access_token"]

with open(branding_path, encoding="utf-8") as handle:
    branding = json.load(handle)

failed = False
for key, value in branding.items():
    if key.startswith("_"):
        continue
    # Logo 允许随站点域名变化，用 LOGO_URL 覆盖仓库中的默认值
    if key == "Logo" and logo_url:
        value = logo_url
    result = call("/api/option/", {"key": key, "value": value}, token=token, method="PUT")
    ok = bool(result.get("success"))
    print("  %-12s = %-46s %s" % (key, value, "OK" if ok else "失败: %s" % result.get("message")))
    failed = failed or not ok

sys.exit(1 if failed else 0)
PY

echo "完成。浏览器需 Ctrl+F5 强制刷新才会生效。"
