import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ShareCard } from "./ShareCard";
import { SHARE_CONFIG } from "@/lib/share/shareConfig";
import type { ShareCardData } from "@/lib/domain/shareCard";

const base: ShareCardData = {
  periodLabel: "今週",
  rangeText: "10/5〜10/11",
  partial: false,
  wastePercent: 18.4,
  level: "normal",
  comparison: { kind: "down", points: 3.2 },
  zeroWaste: false,
  composition: { necessary: 62, satisfied: 20, waste: 18 },
  recordedDays: 5,
  elapsedDays: 7,
  noSpendDays: 2,
  streakDays: 12,
  trend: [30, 28, null, 25, 22, 20, 21, 18.4],
  trendHasLine: true,
  fewRecords: false,
};

/** マークアップから、見える文字だけを取り出す */
function textOf(data: ShareCardData, config = SHARE_CONFIG): string {
  return renderToStaticMarkup(<ShareCard data={data} config={config} />)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ");
}

describe("ShareCard", () => {
  it("家計体脂肪率・前週比・日数・内訳を表示する", () => {
    const text = textOf(base);
    expect(text).toContain("今週の家計体脂肪率");
    expect(text).toContain("18");
    expect(text).toContain(".4");
    expect(text).toContain("前週比 ▼ 3.2pt 減量成功！");
    expect(text).toContain("5 /7日");
    expect(text).toContain("12");
    expect(text).toContain("必要 62%");
    expect(text).toContain("ムダ 18%");
  });

  it("下部に「#家計ダイエット」とアプリ名だけを入れ、URLは入れない", () => {
    const text = textOf(base);
    expect(text).toContain("#家計ダイエット");
    expect(text).toContain("家計ダイエット");
    expect(text).not.toMatch(/https?:\/\//);
    expect(text).not.toContain("vercel");
  });

  it("設定に URL を入れれば、その文言がそのまま画像に出る（将来の拡張）", () => {
    const text = textOf(base, { ...SHARE_CONFIG, url: "https://example.com" });
    expect(text).toContain("https://example.com");
  });

  it("金額を表す文字（¥ ￥ 円）を一切出さない", () => {
    const states: ShareCardData[] = [
      base,
      { ...base, comparison: { kind: "up", points: 2.5 }, level: "high", wastePercent: 24.9 },
      { ...base, comparison: { kind: "none" }, trendHasLine: false, trend: [null, null, null, null, null, null, null, 18.4] },
      { ...base, zeroWaste: true, wastePercent: 0, level: "lean" },
      { ...base, streakDays: 0, fewRecords: true, partial: true },
    ];
    for (const s of states) {
      const text = textOf(s);
      expect(text).not.toMatch(/[¥￥円]/);
    }
  });

  describe("状態ごとの表示（破綻しない）", () => {
    it("前週に記録がない: 「はじめての計量」", () => {
      expect(textOf({ ...base, comparison: { kind: "none" } })).toContain("はじめての計量");
    });
    it("前週と同じ割合", () => {
      expect(textOf({ ...base, comparison: { kind: "same" } })).toContain("前週と同じ");
    });
    it("増えた週: 「少し増量」", () => {
      expect(textOf({ ...base, comparison: { kind: "up", points: 2.1 } })).toContain("▲ 2.1pt 少し増量…");
    });
    it("ムダゼロ: 「ムダゼロ！」", () => {
      expect(textOf({ ...base, zeroWaste: true, wastePercent: 0, level: "lean" })).toContain("ムダゼロ！");
    });
    it("記録が少ない: 参考値の注意", () => {
      expect(textOf({ ...base, fewRecords: true })).toContain("記録が少ないので参考値");
    });
    it("進行中の週: 「途中経過」", () => {
      expect(textOf({ ...base, partial: true })).toContain("途中経過");
      expect(textOf(base)).not.toContain("途中経過");
    });
    it("連続記録が0日: 「再スタート」", () => {
      expect(textOf({ ...base, streakDays: 0 })).toContain("再スタート");
    });
    it("推移を折れ線にできない: 「推移はこれから」", () => {
      expect(textOf({ ...base, trendHasLine: false })).toContain("推移はこれから");
      expect(textOf(base)).not.toContain("推移はこれから");
    });
    it("100%でも表示できる", () => {
      const text = textOf({ ...base, wastePercent: 100, level: "obese", composition: { necessary: 0, satisfied: 0, waste: 100 } });
      expect(text).toContain("100");
      expect(text).toContain("ダイエット推奨");
    });
  });
});
