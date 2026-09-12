#!/usr/bin/env bash
# 将 model-pricing.json 中的模型定价写入 New-API（走官方 model_pricing 接口，不直接改库）。
#
# 用法:
#   ADMIN_PASS='管理员密码' ./apply-pricing.sh
#   API_BASE=https://ai.kyeai.xyz ADMIN_USER=root ADMIN_PASS=xxx ./apply-pricing.sh
#
# 为什么不用通用 option 接口：
#   PUT /api/option/ 写 ModelRatio 是「整表替换」，只写几个模型会把其余内置定价
#   全部抹掉、退回 37.5 的兜底占位值。PATCH /api/option/model_pricing 是按模型合并，
#   只影响指定模型。
#
# 注意：单个模型的 pricing 是「整体替换」语义 —— 改任何一个字段都要把该模型的
#       全部字段一起传，否则未传的字段会被清空。
set -euo pipefail

API_BASE="${API_BASE:-https://ai.kyeai.xyz}"
ADMIN_USER="${ADMIN_USER:-root}"
ADMIN_PASS="${ADMIN_PASS:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRICING_JSON="${PRICING_JSON:-$SCRIPT_DIR/model-pricing.json}"

if [ -z "$ADMIN_PASS" ]; then
  echo "错误: 必须通过环境变量提供管理员密码 ADMIN_PASS" >&2
  exit 1
fi
command -v python3 >/dev/null || { echo "错误: 需要 python3" >&2; exit 1; }

echo "目标站点: $API_BASE"
API_BASE="$API_BASE" ADMIN_USER="$ADMIN_USER" ADMIN_PASS="$ADMIN_PASS" \
PRICING_JSON="$PRICING_JSON" python3 - <<'PY'
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

base = os.environ["API_BASE"].rstrip("/")
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def call(path, payload=None, token=None, method="POST"):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(base + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with opener.open(req, timeout=90) as resp:
            return json.loads(resp.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as err:
        return json.loads(err.read().decode("utf-8", "replace"))


login = call("/api/user/login",
             {"username": os.environ["ADMIN_USER"], "password": os.environ["ADMIN_PASS"]})
if not login.get("success"):
    sys.exit("登录失败: %s" % login.get("message"))
token = login["data"]["access_token"]

with open(os.environ["PRICING_JSON"], encoding="utf-8") as handle:
    pricing = json.load(handle)
models = {k: v for k, v in pricing.items() if not k.startswith("_")}
targets = list(models)

# 取当前 version 作为乐观锁：并发修改会返回 409 而不是静默覆盖
query = "&".join("model=%s" % urllib.parse.quote(m) for m in targets)
snapshot = call("/api/option/model_pricing?" + query, token=token, method="GET")
entries = (snapshot.get("data") or {}).get("entries") or []
versions = {e["model_name"]: e["version"] for e in entries}

missing = [m for m in targets if m not in versions]
if missing:
    sys.exit("以下模型未在快照中返回，无法安全写入: %s" % ", ".join(missing))

changes = [{"model_name": m, "expected_version": versions[m], "pricing": models[m]}
           for m in targets]

result = call("/api/option/model_pricing", {"changes": changes}, token=token, method="PATCH")
if not result.get("success"):
    sys.exit("写入失败: %s" % result.get("message"))
print("已更新: %s" % ", ".join(result["data"]["updated_models"]))

# 回读确认
snapshot = call("/api/option/model_pricing?" + query, token=token, method="GET")
failed = False
for entry in (snapshot.get("data") or {}).get("entries") or []:
    name = entry["model_name"]
    configured = entry.get("configured") or {}
    want = models.get(name, {})
    bad = [k for k in want if configured.get(k) != want[k]]
    if bad:
        failed = True
        print("  %-30s 不一致字段: %s" % (name, ", ".join(bad)))
    else:
        print("  %-30s OK (%d 个字段)" % (name, len(want)))

sys.exit(1 if failed else 0)
PY

echo "完成。定价即时生效，新请求按新价计费。"
