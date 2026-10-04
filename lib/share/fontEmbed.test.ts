import { describe, expect, it } from "vitest";
import { extractFontUrl, mergeFontFaces, parseUnicodeRange, rangesCoverAny, weightMatches } from "./fontEmbed";

describe("parseUnicodeRange", () => {
  it("単独と範囲を読む", () => {
    expect(parseUnicodeRange("U+25EE8, U+26FF6-26FF8")).toEqual([
      [0x25ee8, 0x25ee8],
      [0x26ff6, 0x26ff8],
    ]);
  });
  it("ワイルドカード（U+4??）を範囲にする", () => {
    expect(parseUnicodeRange("U+4??")).toEqual([[0x400, 0x4ff]]);
  });
  it("読めない指定は無視する", () => {
    expect(parseUnicodeRange("foo, U+41")).toEqual([[0x41, 0x41]]);
  });
});

describe("rangesCoverAny", () => {
  const ranges = parseUnicodeRange("U+3042-3093, U+30A2");
  it("文字のどれかが範囲に入っていれば true", () => {
    expect(rangesCoverAny(ranges, [0x3042, 0x1])).toBe(true); // あ
    expect(rangesCoverAny(ranges, [0x30a2])).toBe(true); // ア
  });
  it("どれも入っていなければ false", () => {
    expect(rangesCoverAny(ranges, [0x41, 0x6f22])).toBe(false);
  });
});

describe("weightMatches", () => {
  it("単独の太さ", () => {
    expect(weightMatches("700", [700, 800])).toBe(true);
    expect(weightMatches("400", [700, 800])).toBe(false);
  });
  it("可変フォントの範囲", () => {
    expect(weightMatches("100 900", [700])).toBe(true);
    expect(weightMatches("100 500", [700])).toBe(false);
  });
});

describe("extractFontUrl", () => {
  it("相対URLを、スタイルシートの場所を基準に絶対URLにする", () => {
    expect(
      extractFontUrl('url("../media/a.woff2") format("woff2")', "https://x.dev/_next/static/chunks/a.css")
    ).toBe("https://x.dev/_next/static/media/a.woff2");
  });
  it("絶対URLはそのまま", () => {
    expect(extractFontUrl("url(https://x.dev/f.woff2)", "https://y.dev/a.css")).toBe("https://x.dev/f.woff2");
  });
  it("data URL や url がないものは null", () => {
    expect(extractFontUrl('url("data:font/woff2;base64,AAAA")', "https://x.dev/")).toBeNull();
    expect(extractFontUrl("local(Arial)", "https://x.dev/")).toBeNull();
  });
});

describe("mergeFontFaces", () => {
  const range = "U+3042-3093";

  it("同じファイル・範囲で太さだけ違うもの（可変フォント）は、太さの範囲にまとめる", () => {
    const merged = mergeFontFaces([
      { family: "Noto Sans JP", weight: "500", url: "https://x/a.woff2", range },
      { family: "Noto Sans JP", weight: "700", url: "https://x/a.woff2", range },
    ]);
    expect(merged).toEqual([{ family: "Noto Sans JP", weight: "500 700", url: "https://x/a.woff2", range }]);
  });

  it("太さごとに別ファイルのもの（静的フォント）は、そのまま別々に残す", () => {
    const merged = mergeFontFaces([
      { family: "M PLUS Rounded 1c", weight: "700", url: "https://x/b700.woff2", range },
      { family: "M PLUS Rounded 1c", weight: "800", url: "https://x/b800.woff2", range },
    ]);
    expect(merged.map((m) => m.weight)).toEqual(["700", "800"]);
  });

  it("範囲が違えば、同じファイル名でもまとめない", () => {
    const merged = mergeFontFaces([
      { family: "Noto Sans JP", weight: "700", url: "https://x/a.woff2", range: "U+41" },
      { family: "Noto Sans JP", weight: "700", url: "https://x/a.woff2", range: "U+42" },
    ]);
    expect(merged).toHaveLength(2);
  });

  it("1つだけならそのまま（太さは単独の値）", () => {
    expect(mergeFontFaces([{ family: "A", weight: "700", url: "u", range: "" }])).toEqual([
      { family: "A", weight: "700", url: "u", range: "" },
    ]);
  });

  it("範囲指定（400 600）とも、まとめて範囲を広げられる", () => {
    const merged = mergeFontFaces([
      { family: "A", weight: "400 600", url: "u", range },
      { family: "A", weight: "700", url: "u", range },
    ]);
    expect(merged[0].weight).toBe("400 700");
  });
});
