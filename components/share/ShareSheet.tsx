"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { ShareCard } from "./ShareCard";
import type { ShareCardData } from "@/lib/domain/shareCard";
import { loadShareCardData } from "@/lib/share/loadShareCardData";
import { renderCardToBlob } from "@/lib/share/renderCard";
import { SHARE_CONFIG, buildShareText } from "@/lib/share/shareConfig";
import { canShareFile, shareImage } from "@/lib/share/shareImage";
import { download, prefersShareSheet } from "@/lib/saveFile";

interface ShareSheetProps {
  /** 何週前の週か（0 = 今週） */
  weeksBack: number;
  onClose: () => void;
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * 計量結果の画像を作って、プレビューを見せてから共有する。
 * プレビューを挟むのは、画像を確認してから送れるようにするためと、
 * iPhone の共有シートが「タップ直後」にしか開けない（画像づくりの待ち時間のあとだと拒否される）ため。
 */
export function ShareSheet({ weeksBack, onClose }: ShareSheetProps) {
  const [data, setData] = useState<ShareCardData | null>(null);
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 1. 端末内のデータから、カードに載せる値を作る
  useEffect(() => {
    let cancelled = false;
    loadShareCardData(weeksBack)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [weeksBack]);

  // 2. 画面の外に置いたカードを、画像（PNG）にする
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        // カードが画面に出るのを待つ
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        const node = cardRef.current;
        if (!node) return;
        const blob = await renderCardToBlob(node);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        const file = new File([blob], `kakeibo-diet-${format(new Date(), "yyyyMMdd")}.png`, {
          type: "image/png",
        });
        setImage({ url: objectUrl, file });
      } catch (e) {
        if (!cancelled) setError(`画像を作れませんでした（${errorMessage(e)}）`);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data]);

  const canShare = image ? canShareFile(image.file) : false;
  // iPhone やホーム画面のアプリは、共有シートの「画像を保存」で保存するので、別のボタンは出さない
  const showSaveButton = canShare && !prefersShareSheet();

  async function handleShare() {
    if (!image) return;
    const result = await shareImage(image.file, {
      text: buildShareText(),
      title: SHARE_CONFIG.appName,
    });
    if (result === "shared") setStatus("シェアしました");
    if (result === "downloaded") setStatus("画像をダウンロードしました");
  }

  return (
    <BottomSheet title="計量結果をシェア" onClose={onClose}>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-base" style={{ aspectRatio: "4 / 5" }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- 端末内で作った blob の画像なので、next/image は使わない
          <img src={image.url} alt="計量結果の画像" className="block h-full w-full" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-ink-soft" aria-busy={!error}>
            {error ? (
              <p role="alert" className="px-6 text-center font-bold text-waste">
                {error}
              </p>
            ) : (
              <>
                <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-mint-light border-t-mint" />
                画像を作っています…
              </>
            )}
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-ink-soft">金額は載りません（割合と日数だけの画像です）</p>

      {status && (
        <p role="status" className="mt-2 text-center text-sm font-bold text-mint-dark">
          {status}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={!image}
          onClick={() => void handleShare()}
          className="h-14 rounded-2xl bg-mint font-heading text-lg font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-40"
        >
          {canShare || !image ? "📤 シェアする" : "⬇️ 画像をダウンロード"}
        </button>
        {showSaveButton && image && (
          <button
            type="button"
            onClick={() => {
              download(image.file);
              setStatus("画像をダウンロードしました");
            }}
            className="h-12 rounded-2xl bg-base font-bold text-ink-soft"
          >
            画像を保存
          </button>
        )}
        <button type="button" onClick={onClose} className="h-12 rounded-2xl text-sm font-bold text-ink-soft">
          閉じる
        </button>
      </div>

      {/* 画像にするためのカード。画面の外に置き、画像ができたら取り除く */}
      {data && !image && !error && (
        <div aria-hidden style={{ position: "fixed", left: -100000, top: 0, pointerEvents: "none" }}>
          <ShareCard ref={cardRef} data={data} />
        </div>
      )}
    </BottomSheet>
  );
}
