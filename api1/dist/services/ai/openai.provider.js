// OpenAI接続版（本番候補）。API障害時は安全フォールバック。
export class OpenAIProvider {
    apiKey;
    constructor(apiKey) { this.apiKey = apiKey; }
    async evaluate(input) {
        // 1) 低リスクな初期値（障害時フォールバック）
        const fallback = () => {
            const aiChallenge = Math.max(1, Math.min(7, Math.round((input.challengeU + 2))));
            const aiSkill = Math.max(1, Math.min(7, Math.round((input.skillU + 1))));
            return {
                aiChallenge, aiSkill,
                aiComment: 'openai-fallback: 一時的に簡易評価を返しました。',
                regoalAI: aiChallenge <= 2 ? '負荷を落として継続しよう' : undefined,
            };
        };
        try {
            const { default: OpenAI } = await import('openai');
            const client = new OpenAI({ apiKey: this.apiKey });
            // プロンプトは簡素・非個人情報。数値出力の厳格化を誘導。
            const sys = 'You are an assistant that outputs short, safe coaching hints in Japanese.';
            const usr = `挑戦度:${input.challengeU} 能力度:${input.skillU} 理由:${input.reasonU ?? ''}\n` +
                '1..7の整数で aiChallenge, aiSkill を推定し、短い日本語コメントを返して。' +
                'JSONで {"aiChallenge":n,"aiSkill":n,"aiComment":"...","regoalAI":"...?"} の形。';
            const resp = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }],
                temperature: 0.2,
            });
            const text = resp.choices?.[0]?.message?.content || '';
            // ラフにJSON抽出（失敗時はfallback）
            const json = text.match(/\{[\s\S]*\}/)?.[0];
            if (!json)
                return fallback();
            const parsed = JSON.parse(json);
            const clamp = (n) => Math.max(1, Math.min(7, Number(n) || 1));
            return {
                aiChallenge: clamp(parsed.aiChallenge),
                aiSkill: clamp(parsed.aiSkill),
                aiComment: String(parsed.aiComment || '短評なし').slice(0, 200),
                regoalAI: parsed.regoalAI ? String(parsed.regoalAI).slice(0, 120) : undefined,
            };
        }
        catch {
            return fallback();
        }
    }
}
export default OpenAIProvider;
