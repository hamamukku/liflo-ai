// スタブ定義: OpenAI SDK をインストールしていなくても tsc が通る
declare module 'openai' {
  export interface ChatCompletionChoice {
    message?: { role: string; content: string };
  }
  export interface ChatCompletion {
    choices: ChatCompletionChoice[];
  }
  export interface Chat {
    completions: {
      create(params: any): Promise<ChatCompletion>;
    };
  }

  export default class OpenAI {
    constructor(config: { apiKey: string });
    chat: Chat;
  }
}
