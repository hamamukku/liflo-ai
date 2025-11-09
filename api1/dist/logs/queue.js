export class LogQueue {
    buffer = [];
    timer = null;
    sink;
    batchSize;
    flushIntervalMs;
    constructor(opts) {
        this.sink = opts.sink;
        this.batchSize = opts.batchSize ?? 20;
        this.flushIntervalMs = opts.flushIntervalMs ?? 3000;
    }
    // controllers から呼ばれる公開 API（重要）
    async append(rows) {
        if (!Array.isArray(rows))
            rows = [rows];
        this.buffer.push(...rows);
        if (this.buffer.length >= this.batchSize) {
            await this.flush();
        }
        else {
            this.scheduleFlush();
        }
    }
    scheduleFlush() {
        if (this.timer)
            return;
        this.timer = setTimeout(async () => {
            this.timer = null;
            try {
                await this.flush();
            }
            catch (e) {
                // swallow (下位 sink がエラーならログだけ吐く)
                // ここでは console.error で可
                // eslint-disable-next-line no-console
                console.error("LogQueue flush failed:", e);
            }
        }, this.flushIntervalMs);
    }
    async flush() {
        if (this.buffer.length === 0)
            return;
        const batch = this.buffer.splice(0, this.batchSize);
        await this.sink.append(batch);
    }
}
