import { describe, expect, it } from "vitest";
import { clampToToday, labelForDateKey } from "./date";

const today = new Date(2026, 9, 10); // 2026-10-10 (土)

describe("clampToToday", () => {
  it("過去日と今日はそのまま返す", () => {
    expect(clampToToday("2026-10-01", today)).toBe("2026-10-01");
    expect(clampToToday("2026-10-10", today)).toBe("2026-10-10");
  });

  it("未来日は今日にそろえる", () => {
    expect(clampToToday("2026-10-11", today)).toBe("2026-10-10");
    expect(clampToToday("2027-01-01", today)).toBe("2026-10-10");
  });
});

describe("labelForDateKey", () => {
  it("今日・昨日は名前で返す", () => {
    expect(labelForDateKey("2026-10-10", today)).toBe("今日");
    expect(labelForDateKey("2026-10-09", today)).toBe("昨日");
  });

  it("それ以前は「月/日(曜)」で返す", () => {
    expect(labelForDateKey("2026-10-08", today)).toBe("10/8(木)");
  });

  it("月をまたぐ昨日も判定できる", () => {
    expect(labelForDateKey("2026-09-30", new Date(2026, 9, 1))).toBe("昨日");
  });
});
