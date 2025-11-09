import type { ILogSink, LogRow } from './index';

/**
 * ConsoleSink writes log events to STDOUT. This sink is primarily intended for
 * development environments or debugging scenarios where persistent storage is
 * not required. Each log row is serialised as a single line of JSON to aid
 * machine parsing. The sink implements the {@link ILogSink} interface.
 */
export class ConsoleSink implements ILogSink {
  /**
   * Append one or more events to the console. The operation completes
   * immediately; no internal buffering is performed. Errors are swallowed to
   * prevent log failures from impacting the caller.
   *
   * @param rows Array of log rows to print.
   */
  async append(rows: LogRow[]): Promise<void> {
    try {
      for (const row of rows) {
        // Stringify with stable ordering for predictable output
        const serialised = JSON.stringify(row);
        // Use console.log rather than process.stdout.write to play nicely with
        // existing loggers (e.g. pino) and line buffering.
        console.log(serialised);
      }
    } catch {
      // Drop log messages on serialization/printing errors. It is safer to lose
      // audit data than to disrupt the primary application flow.
    }
  }
}
