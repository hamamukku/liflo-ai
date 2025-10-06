/** 目標の状態：進行中 or 終了2種（達成=1000 / 中止=999） */
export type GoalStatus = 'active' | 1000 | 999; // DoD: 三値固定（UI/仕様と一致）
// 参考: 設計ドキュメントのデータ定義とAPI契約を踏襲

export interface Goal {
  id: string;
  userId: string;
  content: string;
  status: GoalStatus;
  /** 達成(1000) / 中止(999)時は必須（サービス層で厳格化） */
  reasonU?: string;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

/** 新規作成入力 */
export interface CreateGoalInput {
  content: string;
}

/** 更新入力（型レベルでも「終了時は理由必須」を補助的に表現） */
type UpdateGoalActive = {
  content?: string;
  status?: 'active';
  reasonU?: never;
};
type UpdateGoalClosed = {
  content?: string;
  status: 1000 | 999;
  reasonU: string;
};
export type UpdateGoalInput = UpdateGoalActive | UpdateGoalClosed;

/** 補助定数（誤値混入を避ける） */
export const GOAL_DONE = 1000 as const;
export const GOAL_ABORT = 999 as const;
