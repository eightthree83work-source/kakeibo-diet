import type { CSSProperties, Ref } from "react";
import { BODY_FAT_LEVEL_LABEL, type BodyFatLevel } from "@/lib/domain/budgetProgress";
import type { ShareCardData } from "@/lib/domain/shareCard";
import { FONT_BODY, FONT_HEADING } from "@/lib/share/cardFonts";
import { SHARE_CONFIG, type ShareConfig } from "@/lib/share/shareConfig";
import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/share/cardSize";

/**
 * 週次レポートの「計量結果」カード（1080×1350）。画像にして共有する。
 *
 * - **金額は一切出さない**（割合・日数・回数だけ）。
 * - 画像は端末のダーク/ライトに左右されないよう、色とフォントを直接指定し、CSS変数やTailwindは使わない。
 * - 位置は固定値（px）で組む。画像にするときの見た目が、画面の大きさで変わらないようにするため。
 */

const C = {
  mint: "#3dbd93",
  mintDark: "#2a9b77",
  mintDeep: "#1f7a5c",
  mintLight: "#c9f0e1",
  cream: "#fffbf5",
  ink: "#2d2a26",
  inkSoft: "#7a756d",
  coral: "#ff6b5d",
  coralDeep: "#e04a3c",
  coralLight: "#ffe1dc",
  yellow: "#ffc857",
  yellowLight: "#fff2d6",
  yellowDeep: "#8a5a00",
  track: "#ece6db",
  white: "#ffffff",
};

const LEVEL_STYLE: Record<BodyFatLevel, { number: string; pillBg: string; pillText: string }> = {
  lean: { number: C.mintDark, pillBg: C.mintLight, pillText: C.mintDeep },
  normal: { number: C.mintDark, pillBg: C.mintLight, pillText: C.mintDeep },
  high: { number: C.coral, pillBg: C.yellowLight, pillText: C.yellowDeep },
  obese: { number: C.coral, pillBg: C.coralLight, pillText: C.coralDeep },
};

/** ゲージの帯（0〜40%を4つに分ける。判定の境目 10/20/30% と同じ） */
const GAUGE_ZONES = [C.mint, "#9be0c5", C.yellow, C.coral];
const GAUGE_MAX_PERCENT = 40;

const COMPOSITION = [
  { key: "necessary", label: "必要", color: C.mint },
  { key: "satisfied", label: "満足", color: C.yellow },
  { key: "waste", label: "ムダ", color: C.coral },
] as const;

const card = {
  white: {
    background: "rgba(255,255,255,0.86)",
    borderRadius: 44,
  } satisfies CSSProperties,
};

function Pill({ children, bg, color, size = 36 }: { children: React.ReactNode; bg: string; color: string; size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: bg,
        color,
        fontFamily: FONT_HEADING,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        padding: `${Math.round(size * 0.32)}px ${Math.round(size * 0.7)}px`,
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Logo() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="18" fill={C.mint} />
      <circle cx="32" cy="32" r="22" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="2" strokeDasharray="0.6 2.6" />
      <circle cx="32" cy="32" r="17" fill="#fff" />
      <g fill="none" stroke={C.mintDark} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="25.5,24 32,32.5 38.5,24" />
        <line x1="32" y1="32.5" x2="32" y2="41" />
        <line x1="26.5" y1="35" x2="37.5" y2="35" />
        <line x1="26.5" y1="38.4" x2="37.5" y2="38.4" />
      </g>
    </svg>
  );
}

function Header({ data }: { data: ShareCardData }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Logo />
        <span style={{ fontFamily: FONT_HEADING, fontWeight: 800, fontSize: 42, color: C.mintDeep }}>
          {SHARE_CONFIG.appName}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {data.partial && (
          <Pill bg={C.yellowLight} color={C.yellowDeep} size={28}>
            途中経過
          </Pill>
        )}
        <Pill bg="rgba(255,255,255,0.8)" color={C.ink} size={34}>
          {data.rangeText}
        </Pill>
      </div>
    </div>
  );
}

function comparisonBadge(data: ShareCardData): { text: string; bg: string; color: string } {
  const c = data.comparison;
  switch (c.kind) {
    case "down":
      return { text: `前週比 ▼ ${c.points.toFixed(1)}pt 減量成功！`, bg: C.mintLight, color: C.mintDeep };
    case "up":
      return { text: `前週比 ▲ ${c.points.toFixed(1)}pt 少し増量…`, bg: C.coralLight, color: C.coralDeep };
    case "same":
      return { text: "前週と同じ", bg: C.track, color: C.inkSoft };
    default:
      return { text: "はじめての計量", bg: C.track, color: C.inkSoft };
  }
}

function Gauge({ percent, color }: { percent: number; color: string }) {
  const position = Math.min(Math.max(percent, 0), GAUGE_MAX_PERCENT) / GAUGE_MAX_PERCENT;
  const GAUGE_WIDTH = 840;
  return (
    <div style={{ position: "relative", width: GAUGE_WIDTH, height: 78 }}>
      <div style={{ display: "flex", width: GAUGE_WIDTH, height: 28, borderRadius: 14, overflow: "hidden", marginTop: 8 }}>
        {GAUGE_ZONES.map((zone) => (
          <div key={zone} style={{ flex: 1, background: zone }} />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: position * GAUGE_WIDTH - 22,
          width: 44,
          height: 44,
          borderRadius: 22,
          background: C.white,
          border: `9px solid ${color}`,
          boxSizing: "border-box",
          boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
        }}
      />
      <div style={{ position: "absolute", top: 50, left: 0, width: GAUGE_WIDTH, display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY, fontWeight: 700, fontSize: 24, color: C.inkSoft }}>
        {["0", "10", "20", "30", "40%"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function Hero({ data }: { data: ShareCardData }) {
  const style = LEVEL_STYLE[data.level];
  const badge = comparisonBadge(data);
  const [integer, decimal] = data.wastePercent.toFixed(1).split(".");
  return (
    <div
      style={{
        marginTop: 24,
        height: 496,
        background: C.white,
        borderRadius: 56,
        boxShadow: "0 14px 44px rgba(42,155,119,0.18)",
        padding: "30px 48px 26px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, height: 52 }}>
        <span style={{ fontFamily: FONT_HEADING, fontWeight: 800, fontSize: 40, color: C.inkSoft }}>
          {data.periodLabel}の家計体脂肪率
        </span>
        {data.fewRecords && (
          <Pill bg={C.track} color={C.inkSoft} size={24}>
            記録が少ないので参考値
          </Pill>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", height: 232, marginTop: 4, color: style.number, fontFamily: FONT_HEADING, fontWeight: 800 }}>
        <span style={{ fontSize: 236, lineHeight: "232px", letterSpacing: -4 }}>{integer}</span>
        <span style={{ fontSize: 124, lineHeight: "232px" }}>.{decimal}</span>
        <span style={{ fontSize: 96, lineHeight: "232px", marginLeft: 10 }}>%</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, height: 60, marginTop: 6 }}>
        <Pill bg={data.zeroWaste ? C.mintLight : style.pillBg} color={data.zeroWaste ? C.mintDeep : style.pillText} size={34}>
          {data.zeroWaste ? "ムダゼロ！" : BODY_FAT_LEVEL_LABEL[data.level]}
        </Pill>
        <Pill bg={badge.bg} color={badge.color} size={34}>
          {badge.text}
        </Pill>
      </div>

      <div style={{ marginTop: 16 }}>
        <Gauge percent={data.wastePercent} color={style.number} />
      </div>
    </div>
  );
}

function FlameIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden>
      <path d="M12.6 2c.5 3.2-1.9 4.6-1.9 7 0 1.1.8 1.9 1.8 1.9 1.6 0 2.5-1.6 2.1-3.6 2.6 1.9 4.4 4.6 4.4 7.6a8.9 8.9 0 0 1-17.8 0c0-2.7 1.6-4.8 3.2-6.5 0 1.8.8 3 2 3.2C6.8 8.5 9.7 5.1 12.6 2z" fill="#ff8a3d" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill={C.mint} />
      <polyline points="7.2,12.4 10.6,15.6 16.8,8.8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden>
      <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z" fill="#7aa7ff" />
    </svg>
  );
}

function Tile({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ ...card.white, flex: 1, height: 140, boxSizing: "border-box", padding: "16px 12px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 40 }}>
        {icon}
        <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 28, color: C.inkSoft }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", height: 74, marginTop: 6, fontFamily: FONT_HEADING, fontWeight: 800, color: C.ink }}>
        {children}
      </div>
    </div>
  );
}

function Num({ value, unit }: { value: string | number; unit: string }) {
  return (
    <>
      <span style={{ fontSize: 66, lineHeight: "74px" }}>{value}</span>
      <span style={{ fontSize: 30, lineHeight: "74px", marginLeft: 6, color: C.inkSoft }}>{unit}</span>
    </>
  );
}

function Tiles({ data }: { data: ShareCardData }) {
  return (
    <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
      <Tile icon={<CheckIcon />} label="記録した日">
        <Num value={data.recordedDays} unit={`/${data.elapsedDays}日`} />
      </Tile>
      <Tile icon={<FlameIcon />} label="連続記録">
        {data.streakDays > 0 ? (
          <Num value={data.streakDays} unit="日" />
        ) : (
          <span style={{ fontSize: 38, lineHeight: "74px" }}>再スタート</span>
        )}
      </Tile>
      <Tile icon={<MoonIcon />} label="支出なしの日">
        <Num value={data.noSpendDays} unit="日" />
      </Tile>
    </div>
  );
}

function Composition({ data }: { data: ShareCardData }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_HEADING, fontWeight: 800, fontSize: 30, color: C.inkSoft, height: 38 }}>
        お金の内訳（割合）
      </div>
      <div style={{ display: "flex", height: 40, borderRadius: 20, overflow: "hidden", background: C.track, marginTop: 8 }}>
        {COMPOSITION.map(({ key, color }) =>
          data.composition[key] > 0 ? <div key={key} style={{ width: `${data.composition[key]}%`, background: color }} /> : null
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 30, color: C.ink }}>
        {COMPOSITION.map(({ key, label, color }) => (
          <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 20, height: 20, borderRadius: 10, background: color, display: "inline-block" }} />
            {label} {data.composition[key]}%
          </span>
        ))}
      </div>
    </div>
  );
}

const TREND_W = 856;
const TREND_H = 124;
// bottom は 0% の位置。底の線（BASELINE_Y）はそれより下に引き、点が線や下の文字と重ならないようにする
const TREND = { left: 30, right: TREND_W - 30, top: 52, bottom: 78 };
const BASELINE_Y = 96;

function Trend({ data }: { data: ShareCardData }) {
  const n = data.trend.length;
  const max = Math.max(...data.trend.map((v) => v ?? 0));
  const yMax = Math.max(30, Math.ceil(max / 10) * 10);
  const x = (i: number) => TREND.left + (n > 1 ? (i / (n - 1)) * (TREND.right - TREND.left) : 0);
  const y = (v: number) => TREND.bottom - (v / yMax) * (TREND.bottom - TREND.top);

  const runs: { i: number; v: number }[][] = [];
  data.trend.forEach((v, i) => {
    if (v === null) return;
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1].i === i - 1) last.push({ i, v });
    else runs.push([{ i, v }]);
  });
  const lastIndex = n - 1;
  const lastValue = data.trend[lastIndex];

  return (
    <div>
      <div style={{ fontFamily: FONT_HEADING, fontWeight: 800, fontSize: 30, color: C.inkSoft, height: 38 }}>
        家計体脂肪率の推移（直近{n}週）
      </div>
      {data.trendHasLine ? (
        <svg width={TREND_W} height={TREND_H} viewBox={`0 0 ${TREND_W} ${TREND_H}`} style={{ display: "block" }}>
          <line x1={TREND.left} x2={TREND.right} y1={BASELINE_Y} y2={BASELINE_Y} stroke={C.track} strokeWidth="3" />
          {runs
            .filter((run) => run.length > 1)
            .map((run) => (
              <polyline key={run[0].i} points={run.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")} fill="none" stroke={C.coral} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          {data.trend.map((v, i) =>
            v === null ? null : (
              <circle key={i} cx={x(i)} cy={y(v)} r={i === lastIndex ? 12 : 8} fill={i === lastIndex ? C.coral : C.white} stroke={C.coral} strokeWidth="5" />
            )
          )}
          {lastValue !== null && (
            <text x={x(lastIndex)} y={y(lastValue) - 22} textAnchor="end" fontFamily={FONT_HEADING} fontWeight="800" fontSize="30" fill={C.coralDeep} stroke={C.white} strokeWidth="9" strokeLinejoin="round" paintOrder="stroke">
              {lastValue.toFixed(1)}%
            </text>
          )}
          <text x={TREND.left} y={TREND_H - 4} textAnchor="start" fontFamily={FONT_BODY} fontWeight="700" fontSize="24" fill={C.inkSoft}>
            {n - 1}週前
          </text>
          <text x={TREND.right} y={TREND_H - 4} textAnchor="end" fontFamily={FONT_BODY} fontWeight="700" fontSize="24" fill={C.inkSoft}>
            この週
          </text>
        </svg>
      ) : (
        <div style={{ height: TREND_H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: FONT_BODY, color: C.inkSoft }}>
          <span style={{ fontFamily: FONT_HEADING, fontWeight: 800, fontSize: 34 }}>推移はこれから</span>
          <span style={{ fontWeight: 700, fontSize: 26 }}>記録を続けると、折れ線が育ちます</span>
        </div>
      )}
    </div>
  );
}

function Footer({ config }: { config: ShareConfig }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, height: 44, fontFamily: FONT_HEADING, fontWeight: 800 }}>
      <span style={{ fontSize: 32, color: C.mintDark }}>{config.hashtag}</span>
      <span style={{ fontSize: 26, color: C.inkSoft, fontWeight: 700 }}>・</span>
      <span style={{ fontSize: 28, color: C.inkSoft }}>{config.appName}</span>
      {config.url && <span style={{ fontSize: 24, color: C.inkSoft, fontFamily: FONT_BODY, fontWeight: 700 }}>{config.url}</span>}
    </div>
  );
}

interface ShareCardProps {
  data: ShareCardData;
  config?: ShareConfig;
  ref?: Ref<HTMLDivElement>;
}

export function ShareCard({ data, config = SHARE_CONFIG, ref }: ShareCardProps) {
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        boxSizing: "border-box",
        padding: "64px 72px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(180deg, ${C.mintLight} 0%, #e6f7ef 36%, ${C.cream} 100%)`,
        color: C.ink,
        fontFamily: FONT_BODY,
      }}
    >
      {/* 背景のかざり（ぼかしは使わず、うすい円だけ） */}
      <div style={{ position: "absolute", top: -140, right: -120, width: 420, height: 420, borderRadius: 210, background: "rgba(255,255,255,0.45)" }} />
      <div style={{ position: "absolute", top: 520, left: -160, width: 360, height: 360, borderRadius: 180, background: "rgba(255,255,255,0.28)" }} />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1 }}>
        <Header data={data} />
        <Hero data={data} />
        <Tiles data={data} />
        <div style={{ ...card.white, marginTop: 24, padding: "26px 40px 0", boxSizing: "border-box", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", paddingBottom: 22 }}>
          <Composition data={data} />
          <Trend data={data} />
        </div>
        <div style={{ marginTop: 24 }}>
          <Footer config={config} />
        </div>
      </div>
    </div>
  );
}
