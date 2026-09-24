// イベントの文章・担当キャラクター・画像はフロント側で一括管理する
export type EventCharacter = 1 | 2 | 3;

export const CHARACTER_DETAILS: Record<EventCharacter, { name: string; imageSrc: string }> = {
  1: { name: "ほしみ〜るちゃん", imageSrc: "/ar/characters/koyamachan.png" },
  2: { name: "むすぶくん", imageSrc: "/ar/characters/musubukun.png" },
  3: { name: "神山くん", imageSrc: "/ar/characters/yamachan.png" },
};

export type EventDefinition = {
  title: string;
  content: string;
  choices: string[];
  success: string;
  character: EventCharacter;
  imageSrc?: string;
  titleVisual: "event" | "egg" | "allEggs";
};

export const EVENT_DEFINITIONS: Record<number, EventDefinition> = {
  0: {
    title: "博士からたまごをもらおう",
    content: "キミはどんないきものが好きかな？",
    choices: ["ふしぎないきもの", "かわいいいきもの"],
    success: "博士からたまごをもらったよ",
    character: 1,
    imageSrc: "/event_0.png",
    titleVisual: "event",
  },
  1: {
    title: "たまごがころがりそう！いっしょにベッドを作ろう！",
    content: "どの素材なら、たまごが安心できるかな？",
    choices: ["きのえだ", "サンゴ", "くも"],
    success: "ベッドが完成してたまごが安定したよ",
    character: 2,
    imageSrc: "/event_1.png",
    // p02を読み取った直後は、イベント画像ではなく現在のたまごを見せる
    titleVisual: "event",
  },
  2: {
    title: "この光を、たまごに届けてみよう！",
    content: "どんな色の光を届けようか？",
    choices: ["あかい光", "あおい光", "みどりの光", "むらさきの光"],
    success: "たまごの色が変わったよ",
    character: 3,
    titleVisual: "allEggs",
  },
  3: {
    title: "たまごにパワーを送ってみよう！",
    content: "どんなエネルギーを送る？",
    choices: ["きらめくひらめき", "あったかいぬくもり", "あつあつの勇気"],
    success: "たまごにもようが浮かび上がってきた",
    character: 1,
    // imageSrc: "/event_3.png",
    titleVisual: "allEggs",
  },
  4: {
    title: "みんなが、たまごの変化に気づいたよ",
    content: "ほしみ〜るちゃん、むすぶくん、神山くんが、たまごを応援しているよ。",
    choices: [],
    success: "たまごに小さなひびが入ったよ",
    // p04では三人とも登場するため、この値は通常ARでは使用しない
    character: 1,
    titleVisual: "allEggs",
  },
};

export function getEventDefinition(index: number) {
  return EVENT_DEFINITIONS[index];
}
