export type GoalStatus = "active" | "done" | "cancelled";

export interface Goal {
  id: string;
  title: string;
  status: GoalStatus;
  createdAt: string;
}
