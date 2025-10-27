// web/src/pages/RecordNewPage.tsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createRecord, listGoals, type Goal } from '../app/api'

const isActive = (s: Goal['status'] | undefined) => s === 'active'

interface AIResult {
  aiChallenge: number
  aiSkill: number
  aiComment: string
  regoalAI: string
}

const RecordNewPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoal, setSelectedGoal] = useState('')
  const [challenge, setChallenge] = useState<number | null>(null)
  const [skill, setSkill] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const { items } = await listGoals()
        setGoals(items.filter((g) => isActive(g.status)))
      } catch (err: any) {
        setMessage(err.message || '目標の取得に失敗しました')
      }
    }
    fetchGoals()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setAiResult(null)
    if (!selectedGoal) { setMessage('目標を選択してください'); return }
    if (challenge == null || skill == null) { setMessage('挑戦度と能力度を選択してください'); return }
    try {
      setLoading(true)
      const today = new Date().toISOString().slice(0, 10)
      const data = await createRecord({
        goalId: selectedGoal,
        date: today,
        challengeU: challenge as 1|2|3|4|5|6|7,
        skillU: skill as 1|2|3|4|5|6|7,
        reasonU: reason.trim() || undefined,
      })

      setAiResult({
        aiChallenge: data.aiChallenge ?? 0,
        aiSkill: data.aiSkill ?? 0,
        aiComment: data.aiComment ?? '',
        regoalAI: data.regoalAI ?? '',
      })
      setMessage('記録を保存しました')
      setChallenge(null); setSkill(null); setReason('')
    } catch (err: any) {
      setMessage(err.message || '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const scaleOptions = [1, 2, 3, 4, 5, 6, 7]

  return (
    <div className="max-w-xl mx-auto">
      {/* おしゃれ“戻る”ボタン */}
      <div className="sticky top-2 z-10 mb-4">
        <Link
          to="/"
          aria-label="ホームに戻る"
          className="group inline-flex items-center gap-2 rounded-full border border-gray-300/80 bg-white/80 px-3 py-2 text-blue-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blue-600 transition-transform group-hover:-translate-x-0.5">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-medium">ホームに戻る</span>
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-4">記録を入力</h2>
      {goals.length === 0 ? (
        <p className="text-lg">進行中の目標がありません。先に目標を作成してください。</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 text-lg" htmlFor="goal">目標を選択</label>
            <select id="goal" className="w-full p-3 border rounded text-lg" value={selectedGoal} onChange={(e) => setSelectedGoal(e.target.value)}>
              <option value="">-- 選択してください --</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>{goal.content}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-lg font-semibold">挑戦度（1〜7）</p>
            <div className="grid grid-cols-7 gap-2">
              {scaleOptions.map((n) => (
                <label key={n} className="flex flex-col items-center">
                  <input type="radio" name="challenge" value={n} checked={challenge === n} onChange={() => setChallenge(n)} className="sr-only" />
                  <span className={`cursor-pointer w-10 h-10 flex items-center justify-center border rounded-full text-lg ${challenge === n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>{n}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-lg font-semibold">能力度（1〜7）</p>
            <div className="grid grid-cols-7 gap-2">
              {scaleOptions.map((n) => (
                <label key={n} className="flex flex-col items-center">
                  <input type="radio" name="skill" value={n} checked={skill === n} onChange={() => setSkill(n)} className="sr-only" />
                  <span className={`cursor-pointer w-10 h-10 flex items-center justify中心 border rounded-full text-lg ${skill === n ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}>{n}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1 text-lg" htmlFor="reason">理由（任意）</label>
            <textarea id="reason" className="w-full p-3 border rounded text-lg" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>

          {message && <p className={`text-lg ${message.includes('失敗') ? 'text-red-600' : 'text-green-700'}`}>{message}</p>}

          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white text-lg py-3 rounded" disabled={loading}>
            {loading ? '送信中...' : '送信'}
          </button>
        </form>
      )}

      {aiResult && (
        <div className="mt-8 p-4 border rounded bg-gray-50">
          <h3 className="text-xl font-bold mb-2">AIからの評価</h3>
          <p className="text-lg mb-1">AI評価 挑戦度: {aiResult.aiChallenge}</p>
          <p className="text-lg mb-1">AI評価 能力度: {aiResult.aiSkill}</p>
          <p className="text-lg mb-2">AIコメント: {aiResult.aiComment}</p>
          <p className="text-lg font-semibold">提案: {aiResult.regoalAI}</p>
        </div>
      )}
    </div>
  )
}

export default RecordNewPage
