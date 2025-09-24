import React, { useEffect, useMemo, useState } from "react";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type StickyAdProps = {
  href: string;
  imageSrc?: string;
  imageAlt?: string;
  children?: React.ReactNode;
  position?: Corner;
  width?: number; // px
  height?: number; // px (auto by default)
  offsetX?: number; // px
  offsetY?: number; // px
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
  storageKey?: string; // ローカルストレージに閉じた状態を保持
  closeLabel?: string;
  showBadge?: boolean;
  badgeLabel?: string;
  showClose?: boolean;
};

/**
 * 画面の端に張り付くシンプルな広告/告知コンポーネント。
 * - デフォルトは右下固定、閉じるボタン付き、safe-area対応。
 * - 画像か children のどちらかを表示できます。
 */
export function StickyAd({
  href,
  imageSrc,
  imageAlt = "広告",
  children,
  position = "bottom-right",
  width = 300,
  height,
  offsetX = 16,
  offsetY = 16,
  target = "_blank",
  rel = "noopener noreferrer",
  storageKey = "sticky-ad-dismissed",
  closeLabel = "広告を閉じる",
  showBadge = true,
  badgeLabel = "広告",
  showClose = true,
}: StickyAdProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "1") setDismissed(true);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const style = useMemo<React.CSSProperties>(() => {
    const base: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
      // iOS等のsafe-areaに寄せる
      // 各方向へ env(safe-area-inset-*) + offset
    };
    const x = `${offsetX}px`;
    const y = `${offsetY}px`;
    switch (position) {
      case "top-left":
        base.top = `calc(env(safe-area-inset-top, 0px) + ${y})`;
        base.left = `calc(env(safe-area-inset-left, 0px) + ${x})`;
        break;
      case "top-right":
        base.top = `calc(env(safe-area-inset-top, 0px) + ${y})`;
        base.right = `calc(env(safe-area-inset-right, 0px) + ${x})`;
        break;
      case "bottom-left":
        base.bottom = `calc(env(safe-area-inset-bottom, 0px) + ${y})`;
        base.left = `calc(env(safe-area-inset-left, 0px) + ${x})`;
        break;
      case "bottom-right":
      default:
        base.bottom = `calc(env(safe-area-inset-bottom, 0px) + ${y})`;
        base.right = `calc(env(safe-area-inset-right, 0px) + ${x})`;
        break;
    }
    base.width = width;
    if (height) base.height = height;
    // 上部のバッジ/閉じるボタンによる重なり回避
    const chromePad = showBadge || showClose ? 40 : 0;
    base.paddingTop = chromePad;
    return base;
  }, [position, offsetX, offsetY, width, height, showBadge, showClose]);

  const onClose = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  return (
    <aside className="edge-ad" style={style} aria-label="広告">
      {showClose && (
        <button
          type="button"
          className="edge-ad__close"
          aria-label={closeLabel}
          onClick={onClose}
        >
          ×
        </button>
      )}
      {showBadge && (
        <span className="edge-ad__badge" aria-hidden>
          {badgeLabel}
        </span>
      )}
      <a href={href} target={target} rel={rel} className="edge-ad__link">
        {imageSrc ? (
          // 画像広告
          <img
            src={imageSrc}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            className="edge-ad__img"
            style={{ height: height ? "100%" : "auto", width: "100%" }}
          />
        ) : (
          // カスタム内容（children）
          <div className="edge-ad__content">{children}</div>
        )}
      </a>
    </aside>
  );
}

export default StickyAd;
