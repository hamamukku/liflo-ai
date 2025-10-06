import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Simple fallback page displayed when a user navigates to an unknown route.
 */
const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-3xl font-bold">ページが見つかりません</h2>
      <p className="text-lg">お探しのページは存在しないか、移動された可能性があります。</p>
      <Link
        to="/"
        className="bg-blue-600 hover:bg-blue-500 text-white text-lg px-4 py-2 rounded"
      >
        ホームに戻る
      </Link>
    </div>
  );
};

export default NotFoundPage;