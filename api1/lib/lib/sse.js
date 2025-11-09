/**
 * Server-Sent Events 初期化（互換: 既存呼び出し sseInit(res) のままでOK）
 * @param res Express Response
 * @param opts retry: 再接続(ms), pad: 先頭パディング(一部プロキシ対策)
 */
export function sseInit(res, opts) {
    // 本番向けヘッダ（プロキシ/リバプロ対策含む）
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform'); // no-transform: 圧縮系中間装置の介入防止
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx 等のバッファリング無効化
    // 任意: 先頭にパディング（古いプロキシ対策）
    if (opts?.pad) {
        // 2KB程度のコメントパディング
        res.write(':' + ' '.repeat(2048) + '\n');
    }
    // 任意: 再接続間隔を指示
    if (typeof opts?.retry === 'number' && Number.isFinite(opts.retry)) {
        res.write(`retry: ${Math.max(0, Math.floor(opts.retry))}\n\n`);
    }
    // Nodeの環境によっては flushHeaders が無い場合もあるので安全に呼ぶ
    res.flushHeaders?.();
}
/**
 * データ送信（互換: ssePush(res, data) は従来どおり）
 * @param res
 * @param data 任意の値（文字列はそのまま、他は JSON.stringify）
 * @param opts 追加: event 名 / id を付与可能
 */
export function ssePush(res, data, opts) {
    const lines = [];
    if (opts?.id !== undefined)
        lines.push(`id: ${String(opts.id)}`);
    if (opts?.event)
        lines.push(`event: ${opts.event}`);
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    // 改行安全：SSEは data: を複数行に分割して送る
    for (const ln of payload.split(/\r?\n/)) {
        lines.push(`data: ${ln}`);
    }
    res.write(lines.join('\n') + '\n\n');
}
/**
 * ハートビート（コメント行を定期送信してアイドル切断を防止）
 * 戻り値: 停止用の clear 関数
 */
export function sseHeartbeat(res, intervalMs = 15000) {
    const t = setInterval(() => {
        if (res.writableEnded) {
            clearInterval(t);
            return;
        }
        // コメント行（クライアントには表示されない）
        res.write(`: hb ${Date.now()}\n\n`);
    }, intervalMs);
    return () => clearInterval(t);
}
/**
 * クライアント切断時のクリーンアップを登録
 * Express の req.on('close') を使う
 */
export function sseOnClose(req, cleanup) {
    // close は一度だけ
    const once = () => {
        try {
            cleanup();
        }
        finally {
            req.off?.('close', once);
        }
    };
    req.on('close', once);
}
/** 終了（互換） */
export function sseClose(res) {
    try {
        res.end();
    }
    catch { }
}
/**
 * 便利ラッパ: 1関数で初期化→ハートビート→クリーンアップ登録まで
 * 既存コードへの影響を避けるための“追加”エクスポート
 */
export function createSSE(req, res, opts) {
    sseInit(res, { retry: opts?.retry, pad: opts?.pad });
    const stop = sseHeartbeat(res, opts?.heartbeatMs ?? 15000);
    sseOnClose(req, () => { stop(); sseClose(res); });
    return {
        push: (data, o) => ssePush(res, data, o),
        close: () => { stop(); sseClose(res); }
    };
}
