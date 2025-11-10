export interface FlowTips {
  tips: string[];
}

const DEFAULT_TIPS: string[] = [
  "ゴールを細かく分解し、今やる一歩だけに集中する。",
  "環境ノイズを減らし、没入できる時間を確保する。",
  "内省ノートを短く残し、次のアクションを明確にする。",
  "7割の準備でもまず着手し、後から手直しする。",
];

export class FlowService {
  constructor(private readonly tips: string[] = DEFAULT_TIPS) {}

  getTips(): FlowTips {
    return { tips: this.tips };
  }
}
