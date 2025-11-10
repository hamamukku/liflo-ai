import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./app/providers/AuthProvider";

// 事前ビルドされた Tailwind のプレーンCSSを読み込みます。
// （生成コマンド: npm run tw:build で src/styles/tw.gen.css が作られます）
import "./styles/tw.gen.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
