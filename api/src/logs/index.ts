// api/src/logs/index.ts
export type LogStatus = "success" | "fail";

export type LogRow = {
  ts: string;
  requestId?: string;
  userId?: string;
  endpoint: string;
  method: string;
  event: string;
  status: LogStatus;
  latencyMs?: number;
  ip?: string;
  ua?: string;
  note?: string;
  goalId?: string;
  recordId?: string;
  date?: string;
  statusCode?: number;
  challengeU?: number;
  skillU?: number;
  aiChallenge?: number;
  aiSkill?: number;
};

export interface ILogSink {
  append(rows: LogRow[] | LogRow): Promise<void>;
}

// re-exports
export { ConsoleSink } from "./console.sink.js";
export { SheetsSink } from "./sheets.sink.js";
export { LogQueue } from "./queue.js";
