/**
 * シェア画像と共有テキストに出す文言。ここ1か所を変えれば、画像にも共有にも反映される。
 *
 * 独自ドメインが決まったら `url` に入れる（QRコードを足すときもこの設定を参照する）。
 * `url` が null の間は、画像にも共有テキストにも URL を一切出さない。
 */
export interface ShareConfig {
  appName: string;
  hashtag: string;
  /** 将来の URL。決まるまでは null（仮のURLは画像に載せない） */
  url: string | null;
  /** 共有時に添える一文。空なら付けない */
  message: string;
}

export const SHARE_CONFIG: ShareConfig = {
  appName: "家計ダイエット",
  hashtag: "#家計ダイエット",
  url: null,
  message: "",
};

/** 画像を共有するときに添えるテキスト（メッセージ・ハッシュタグ・URL を、あるものだけ改行でつなぐ） */
export function buildShareText(config: ShareConfig = SHARE_CONFIG): string {
  return [config.message, config.hashtag, config.url]
    .filter((part): part is string => !!part)
    .join("\n");
}
