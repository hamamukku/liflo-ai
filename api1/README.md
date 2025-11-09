# rahuroi-api

PoC→本番まで“差し替え可能”なバックエンド（Express + TypeScript）。
DB/AI はポート/アダプタで切替（Firestore/Postgres, Mock/OpenAI）。

Quick Start:
- cp .env.example .env （値を設定）
- npm i
- npm run dev （http://localhost:8787）

Providers:
- DB: DB_PROVIDER=firestore | postgres
- AI: AI_PROVIDER=mock | openai
