export interface RecordEntry {
  id: string;
  text: string;
  aiComment: string | null;
  createdAt: string;
}

export interface CreateRecordInput {
  text: string;
}
