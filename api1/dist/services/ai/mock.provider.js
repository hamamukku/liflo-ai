// 決定論モック（PoC/テスト用）
export class MockAIProvider {
    async evaluate(input) {
        const clamp = (n) => Math.max(1, Math.min(7, n));
        const aiChallenge = clamp(Math.round((input.challengeU + 1) / 2 + 2));
        const aiSkill = clamp(Math.round((input.skillU + 1) / 2 + 2));
        const gapC = aiChallenge - input.challengeU;
        const gapS = aiSkill - input.skillU;
        const aiComment = `AI所見: 挑戦度Δ=${gapC}, 能力度Δ=${gapS}. ` +
            (input.reasonU ? `理由: ${input.reasonU.slice(0, 80)}...` : '補足なし');
        const regoalAI = aiChallenge <= 2 ? '挑戦幅を小さく刻み直そう' :
            aiChallenge >= 6 && aiSkill >= 6 ? '次は一段難しい課題に' : undefined;
        return { aiChallenge, aiSkill, aiComment, regoalAI };
    }
}
export default MockAIProvider;
