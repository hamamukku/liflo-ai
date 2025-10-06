import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// api.ts のブリッジ関数に合わせる
import { listGoals, saveGoal, type Goal, type GoalStatus } from '../app/api';

type UIStatus = 0 | 1000 | 999;
type FormState = {
  content: string;
  category?: string;
  status: UIStatus;   // UIでは 0/1000/999 を使う（保存時に 'active'/1000/999 へ変換）
  reasonU?: string;
};

const toUIStatus = (s: Goal['status'] | undefined): UIStatus => (s === 1000 || s === 999 ? s : 0);
const toApiStatus = (n: UIStatus): GoalStatus => (n === 0 ? 'active' : (n as 1000 | 999));

/**
 * 新規作成 / 既存編集。
 * 既存編集のときのみ「状態」セレクトを表示。達成(1000)/中止(999)は理由必須。
 */
const GoalFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState<FormState>({ content: '', category: '', status: 0, reasonU: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 既存Goalを読み込み
  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError('');
        const { items } = await listGoals();
        const found = items.find(g => g.id === id);
        if (!found) {
          setError('指定された目標が見つかりませんでした');
          return;
        }
        setForm({
          content: found.content || '',
          category: (found as any).category || '',
          status: toUIStatus(found.status),
          reasonU: found.reasonU || '',
        });
      } catch (err: any) {
        setError(err.message || '目標の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.content || form.content.trim() === '') {
      setError('内容を入力してください');
      return;
    }
    if ((form.status === 1000 || form.status === 999) && (!form.reasonU || form.reasonU.trim() === '')) {
      setError('達成・中止の理由を入力してください');
      return;
    }

    try {
      setLoading(true);
      if (id) {
        await saveGoal({
          id,
          content: form.content.trim(),
          category: form.category?.trim() || undefined,
          status: toApiStatus(form.status),
          reasonU: form.status === 1000 || form.status === 999 ? form.reasonU?.trim() : undefined,
        });
      } else {
        // 新規は 'active' で登録
        await saveGoal({
          content: form.content.trim(),
          category: form.category?.trim() || undefined,
          status: 'active',
        });
      }
      navigate('/goals');
    } catch (err: any) {
      setError(err.message || '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{id ? '目標を編集' : '目標を追加'}</h2>

      {loading ? (
        <p className="text-lg">読み込み中...</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block mb-1 text-lg" htmlFor="content">内容</label>
            <input
              id="content"
              type="text"
              className="w-full p-3 border rounded text-lg"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-lg" htmlFor="category">カテゴリ（任意）</label>
            <input
              id="category"
              type="text"
              className="w-full p-3 border rounded text-lg"
              value={form.category || ''}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>

          {id && (
            <div>
              <label className="block mb-1 text-lg" htmlFor="status">状態</label>
              <select
                id="status"
                className="w-full p-3 border rounded text-lg"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: Number(e.target.value) as UIStatus })}
              >
                <option value={0}>進行中</option>
                <option value={1000}>達成</option>
                <option value={999}>中止</option>
              </select>
            </div>
          )}

          {(form.status === 1000 || form.status === 999) && (
            <div>
              <label className="block mb-1 text-lg" htmlFor="reason">理由</label>
              <textarea
                id="reason"
                className="w-full p-3 border rounded text-lg"
                value={form.reasonU || ''}
                onChange={(e) => setForm({ ...form, reasonU: e.target.value })}
                rows={3}
                required
              />
            </div>
          )}

          {error && <p className="text-red-600 text-lg">{error}</p>}

          <div className="flex space-x-4">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-lg py-3 rounded">
              保存
            </button>
            <button type="button" className="flex-1 bg-gray-400 hover:bg-gray-300 text-white text-lg py-3 rounded" onClick={() => navigate('/goals')}>
              キャンセル
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default GoalFormPage;
