import { describe, expect, it } from "vitest";
import { describeTodayRemaining } from "./format";

describe("describeTodayRemaining", () => {
  it("プラスのときは「今日あと使える額」と金額を返す", () => {
    expect(describeTodayRemaining(1234)).toEqual({
      over: false,
      label: "今日あと使える額",
      amountText: "¥1,234",
    });
  });

  it("マイナスのときは符号を付けず「今日は使いすぎ」とする", () => {
    expect(describeTodayRemaining(-9286)).toEqual({
      over: true,
      label: "今日は使いすぎ",
      amountText: "¥9,286",
    });
  });

  it("四捨五入して0円になる微小なマイナスは使いすぎ扱いにしない", () => {
    expect(describeTodayRemaining(-0.4).over).toBe(false);
  });

  it("読み込み中（undefined）は「---」を返す", () => {
    expect(describeTodayRemaining(undefined).amountText).toBe("---");
  });
});
