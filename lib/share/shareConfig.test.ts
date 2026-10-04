import { describe, expect, it } from "vitest";
import { SHARE_CONFIG, buildShareText } from "./shareConfig";

describe("SHARE_CONFIG", () => {
  it("今は URL を持たない（仮のURLは画像に載せない）", () => {
    expect(SHARE_CONFIG.url).toBeNull();
  });
  it("ハッシュタグは # で始まる", () => {
    expect(SHARE_CONFIG.hashtag.startsWith("#")).toBe(true);
  });
});

describe("buildShareText", () => {
  const base = { appName: "家計ダイエット", hashtag: "#家計ダイエット", url: null, message: "" };

  it("既定ではハッシュタグだけ", () => {
    expect(buildShareText(base)).toBe("#家計ダイエット");
  });
  it("メッセージとURLがあれば、メッセージ・ハッシュタグ・URL の順で改行でつなぐ", () => {
    expect(
      buildShareText({ ...base, message: "今週の計量結果", url: "https://example.com" })
    ).toBe("今週の計量結果\n#家計ダイエット\nhttps://example.com");
  });
});
