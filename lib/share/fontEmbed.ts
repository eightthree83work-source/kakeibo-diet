/**
 * シェア画像に日本語フォントを埋め込むための処理。
 *
 * html-to-image は、画像を作るとき、ページのフォントを自動では使えない（SVG の中は別世界のため）。
 * 初期設定のままだと、ページにある全フォントを埋め込もうとする。このアプリのフォントは、
 * 日本語の文字ごとに約250個に分割されている（unicode-range）ので、全部は重すぎる。
 * そこで、画像に出す文字を含む分割ファイルだけを選び、data URL にして `@font-face` として渡す。
 */

export interface FontSpec {
  /** `@font-face` の font-family 名（引用符なし） */
  family: string;
  /** 使う太さ */
  weights: number[];
}

/** `unicode-range` の値を、[開始, 終了] のコードポイントの組にする（`U+4??` のワイルドカードにも対応） */
export function parseUnicodeRange(value: string): [number, number][] {
  const ranges: [number, number][] = [];
  for (const token of value.split(",")) {
    const m = token.trim().match(/^U\+([0-9A-Fa-f?]+)(?:-([0-9A-Fa-f]+))?$/);
    if (!m) continue;
    const [, start, end] = m;
    if (start.includes("?")) {
      ranges.push([parseInt(start.replace(/\?/g, "0"), 16), parseInt(start.replace(/\?/g, "F"), 16)]);
    } else {
      const from = parseInt(start, 16);
      ranges.push([from, end ? parseInt(end, 16) : from]);
    }
  }
  return ranges;
}

/** その範囲が、文字のうちどれか1つでも含むか */
export function rangesCoverAny(ranges: [number, number][], codePoints: Iterable<number>): boolean {
  for (const cp of codePoints) {
    if (ranges.some(([from, to]) => cp >= from && cp <= to)) return true;
  }
  return false;
}

/** `font-weight` の指定（"700" や "400 800"）が、使う太さのどれかに当たるか */
export function weightMatches(ruleWeight: string, weights: number[]): boolean {
  const parts = ruleWeight.trim().split(/\s+/).map(Number);
  if (parts.some(Number.isNaN)) return false;
  const [from, to = from] = parts;
  return weights.some((w) => w >= from && w <= to);
}

/** `src: url("../media/x.woff2") format("woff2")` から、URL を絶対URLにして取り出す */
export function extractFontUrl(src: string, baseHref: string): string | null {
  const m = src.match(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^)\s]+))\s*\)/);
  const raw = m?.[1] ?? m?.[2] ?? m?.[3];
  if (!raw || raw.startsWith("data:")) return null;
  try {
    return new URL(raw, baseHref).href;
  } catch {
    return null;
  }
}

export interface FontFaceInfo {
  family: string;
  /** `@font-face` の font-weight の指定（"700" や "400 800"） */
  weight: string;
  url: string;
  /** unicode-range の指定。なければ空文字 */
  range: string;
}

/**
 * 同じフォントファイル・同じ範囲を、太さだけ変えて何度も宣言しているものを1つにまとめる。
 *
 * Noto Sans JP のように、太さ400・500・700が1つの可変フォントのファイルを共有しているものは、
 * 太さごとに同じファイルを何度も埋め込むと無駄に重くなる。範囲（font-weight: 500 700）の宣言に
 * まとめれば、ファイルは1回で済む（可変フォントの標準的な宣言のしかたでもある）。
 * 太さごとに別ファイルのもの（M PLUS Rounded 1c）は、そのまま別々に残る。
 * （注: 画像のフォントは M PLUS だけにしているので、今は実際には効かない。別のフォントを足したとき用）
 */
export function mergeFontFaces(faces: FontFaceInfo[]): FontFaceInfo[] {
  const groups = new Map<string, { face: FontFaceInfo; min: number; max: number }>();
  for (const face of faces) {
    const [from, to = from] = face.weight.trim().split(/\s+/).map(Number);
    const key = `${face.family}|${face.url}|${face.range}`;
    const group = groups.get(key);
    if (group) {
      group.min = Math.min(group.min, from);
      group.max = Math.max(group.max, to);
    } else {
      groups.set(key, { face, min: from, max: to });
    }
  }
  return [...groups.values()].map(({ face, min, max }) => ({
    ...face,
    weight: min === max ? String(min) : `${min} ${max}`,
  }));
}

const dataUrlCache = new Map<string, Promise<string>>();

function fetchAsDataUrl(url: string): Promise<string> {
  let cached = dataUrlCache.get(url);
  if (!cached) {
    cached = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`フォントを取得できませんでした (${res.status}): ${url}`);
        return res.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          })
      );
    // 失敗したものは次回やり直せるように、キャッシュから外す
    cached.catch(() => dataUrlCache.delete(url));
    dataUrlCache.set(url, cached);
  }
  return cached;
}

/**
 * `text` に出てくる文字を含む `@font-face` だけを選び、フォントファイルを埋め込んだ CSS を返す。
 * ページに読み込み済みの同一オリジンのスタイルシートから探す。
 */
export async function buildFontEmbedCSS(text: string, specs: FontSpec[]): Promise<string> {
  const codePoints = new Set<number>();
  for (const ch of text) codePoints.add(ch.codePointAt(0)!);

  const wanted: FontFaceInfo[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // 別オリジンのシートは読めない
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const style = rule.style;
      const family = style.getPropertyValue("font-family").replace(/["']/g, "").trim();
      const spec = specs.find((s) => s.family === family);
      if (!spec || !weightMatches(style.getPropertyValue("font-weight") || "400", spec.weights)) continue;

      const range = style.getPropertyValue("unicode-range");
      if (range && !rangesCoverAny(parseUnicodeRange(range), codePoints)) continue;

      const url = extractFontUrl(style.getPropertyValue("src"), sheet.href ?? location.href);
      if (!url) continue;
      wanted.push({ family, weight: style.getPropertyValue("font-weight") || "400", url, range });
    }
  }

  let blocks: string[];
  try {
    blocks = await Promise.all(
      mergeFontFaces(wanted).map(
        async (face) =>
          `@font-face{font-family:"${face.family}";font-style:normal;font-weight:${face.weight};` +
          `src:url("${await fetchAsDataUrl(face.url)}") format("woff2");` +
          `${face.range ? `unicode-range:${face.range};` : ""}}`
      )
    );
  } catch {
    // 一部だけ埋め込めないと、文字の形が崩れた画像を共有してしまうので、中途半端には作らない
    throw new Error("フォントを読み込めませんでした。ネットにつながる場所で、もう一度お試しください");
  }
  return blocks.join("\n");
}
