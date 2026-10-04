import Link from "next/link";

export const metadata = { title: "オフライン" };

/** 保存されていない画面をオフラインで開いたときに表示する */
export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-5xl" aria-hidden>
        📡
      </p>
      <h1 className="font-heading text-xl font-bold text-ink">オフラインです</h1>
      <p className="text-sm text-ink-soft">
        この画面はまだ読み込めません。
        <br />
        記録は、ネットがなくても使えます。
      </p>
      <Link
        href="/"
        className="mt-2 flex h-14 items-center justify-center rounded-2xl bg-mint px-8 font-heading text-lg font-bold text-white shadow-sm"
      >
        ✏️ 記録画面へ
      </Link>
    </div>
  );
}
