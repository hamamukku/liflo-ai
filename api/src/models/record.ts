/** CSスケールは 1..7 の整数（UIは省略なしで縦並び） */
export type CS = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** YYYY-MM-DD 想定の文字列（実検証は zod 側） */
export type YMD = string;

/** 記録エンティティ（保存時点でAI評価を一体付与） */
export interface RecordEntity {
  id: string;
  userId: string;
  goalId: string;
  date: YMD;
  challengeU: CS;
  skillU: CS;
  reasonU?: string;

  // AI独立評価（保存と不可分：同一トランザクション）
  aiChallenge: number;
  aiSkill: number;
  aiComment: string;
  regoalAI?: string;

  createdAt?: string; // ISO-8601（任意）
}

/** 作成入力（AI評価はサービス側で付与） */
export interface CreateRecordInput {
  goalId: string;
  date: YMD;
  challengeU: CS;
  skillU: CS;
  reasonU?: string;
}

/** 振り返りの返却形（/review）——サービス/コントローラと共有 */
export interface ReviewSummary {
  count: number;
  avgUser: { challenge: number; skill: number };
  avgAI: { challenge: number; skill: number };
  /** 状態比率（%）: flow / anxiety / boredom / apathy */
  states: { flow: number; anxiety: number; boredom: number; apathy: number };
  notes?: string;
}
