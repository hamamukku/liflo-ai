export type GoalStatus = "active" | "done" | "cancelled";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  title: string;
}

export interface UpdateGoalStatusInput {
  status: GoalStatus;
}
