// Dummy API functions for demonstration. Replace with actual API calls.

export interface Goal {
  id: string;
  content: string;
  status?: 'active' | 1000 | 999 | 0;
}

export const listGoals = async (): Promise<{ items: Goal[] }> => {
  // Mock data: return one sample goal.
  return { items: [{ id: '1', content: 'サンプル目標', status: 0 }] };
};

export const createRecord = async (data: any): Promise<{ aiChallenge: number; aiSkill: number; aiComment: string; regoalAI: string; }> => {
  // Mock AI response
  return {
    aiChallenge: data.challengeU,
    aiSkill: data.skillU,
    aiComment: 'これはサンプルのコメントです',
    regoalAI: '次はもう少し挑戦してみましょう',
  };
};

export const loginUser = async (nickname: string, pin: string): Promise<{ success: boolean }> => {
  // Mock login that always succeeds
  return { success: true };
};
