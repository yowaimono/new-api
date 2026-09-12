#!/usr/bin/env python3
"""把原始 logo 素材处理成部署用图（1:1、透明底、256x256）。

为什么需要这三步处理：
  1. 裁成 1:1 —— New-API 的 logo 槽位全是正方形容器
     （public-header/footer 用 object-contain，system-brand 的 sidebar/inline 用
     object-cover + overflow-hidden）。非 1:1 的图在 object-cover 下会被裁掉两侧。
  2. 抠成透明底 —— 否则深色主题下会显示成一块白色方块。
  3. 缩到 256x256 —— 实际渲染尺寸最大 32px，256 已足够并留有大量余量。

抠图不能简单按阈值把白色置透明：原始素材是"彩色前景 + 白底"，
直接阈值会在抗锯齿边缘留下白边。这里按合成模型反解：

    观测值 = 前景色 x alpha + 白色 x (1 - alpha)
    alpha  = 1 - min(R,G,B)/255
    前景色 = (观测值 - 255 x (1 - alpha)) / alpha

用法:
    python3 process-logo.py <原始图片> [输出路径]
"""

import os
import sys

import numpy as np
from PIL import Image

WHITE_CUTOFF = 245   # 判定"墨迹"的亮度阈值
PAD_RATIO = 0.04     # 1:1 裁剪时的额外内边距比例
OUTPUT_SIZE = 256


def build_transparent(source):
    """按合成模型反解出带 alpha 的前景图。"""
    img = Image.open(source).convert("RGBA")
    on_white = Image.alpha_composite(Image.new("RGBA", img.size, (255, 255, 255, 255)), img).convert("RGB")
    arr = np.asarray(on_white).astype(np.float64)

    min_channel = arr.min(axis=2)
    alpha = 1.0 - (min_channel / 255.0)
    alpha[alpha < 0.03] = 0.0

    safe_alpha = np.where(alpha[..., None] == 0, 1.0, alpha[..., None])
    color = np.clip(np.nan_to_num((arr - 255.0 * (1.0 - alpha)[..., None]) / safe_alpha), 0, 255)

    # 极低 alpha 处颜色不稳定，统一填入前景均色，避免出现杂色噪点
    foreground = arr[min_channel < 100].mean(axis=0)
    color[alpha < 0.15] = foreground

    return Image.fromarray(np.dstack([color.astype(np.uint8), (alpha * 255).astype(np.uint8)]), "RGBA")


def crop_square(img, cutoff=WHITE_CUTOFF, pad_ratio=PAD_RATIO):
    """以墨迹包围盒中心为中心，裁出 1:1 正方形。"""
    mask = img.convert("L").point(lambda v: 255 if v < cutoff else 0)
    box = mask.getbbox()
    if box is None:
        raise SystemExit("未在图片中检测到图案")
    left, top, right, bottom = box
    center_x, center_y = (left + right) / 2.0, (top + bottom) / 2.0
    half = max(right - left, bottom - top) / 2.0 * (1.0 + pad_ratio)
    return img.crop((round(center_x - half), round(center_y - half),
                     round(center_x + half), round(center_y + half)))


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    source = sys.argv[1]
    target = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "logo.png")

    transparent = build_transparent(source)
    square = crop_square(transparent)
    square.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS).save(target, "PNG", optimize=True)

    print("原始素材  : %s" % source)
    print("1:1 裁剪  : %dx%d" % square.size)
    print("输出      : %s  %dx%d  %.1f KB" % (target, OUTPUT_SIZE, OUTPUT_SIZE, os.path.getsize(target) / 1024))


if __name__ == "__main__":
    main()
