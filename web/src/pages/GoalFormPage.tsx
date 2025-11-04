import React from 'react';
import { useParams } from 'react-router-dom';

const GoalFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{id ? '目標を編集' : '新しい目標を作成'}</h2>
      <p>目標のフォームをここに配置します。（テンプレート）</p>
    </div>
  );
};
export default GoalFormPage;
