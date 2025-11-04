import React from "react";
import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";

export default function HomePage() {
  return (
    <AppLayout>
      <main className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-2">ホーム</h2>
        <p className="text-gray-600 mb-4">メニューからページへ移動できます。</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <Link to="/record" className="text-blue-600 hover:underline">
              📝 記録ページへ
            </Link>
          </li>
        </ul>
      </main>
    </AppLayout>
  );
}
