import { describe, expect, it } from "vitest";
import { isIosDevice, shouldShowInstallHint } from "./installHint";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

describe("isIosDevice", () => {
  it("iPhone を判定できる", () => {
    expect(isIosDevice(IPHONE, 5)).toBe(true);
  });
  it("Mac を名乗る iPad は、タッチ対応なら iOS とみなす", () => {
    expect(isIosDevice(MAC, 5)).toBe(true);
  });
  it("本物の Mac（タッチなし）や Android は対象外", () => {
    expect(isIosDevice(MAC, 0)).toBe(false);
    expect(isIosDevice(ANDROID, 5)).toBe(false);
  });
});

describe("shouldShowInstallHint", () => {
  const base = { isIos: true, isStandalone: false, dismissed: false };

  it("iOS でまだホーム画面から起動しておらず、閉じてもいなければ表示する", () => {
    expect(shouldShowInstallHint(base)).toBe(true);
  });
  it("ホーム画面から起動している場合は表示しない", () => {
    expect(shouldShowInstallHint({ ...base, isStandalone: true })).toBe(false);
  });
  it("閉じたあとは再表示しない", () => {
    expect(shouldShowInstallHint({ ...base, dismissed: true })).toBe(false);
  });
  it("iOS 以外では表示しない", () => {
    expect(shouldShowInstallHint({ ...base, isIos: false })).toBe(false);
  });
});
