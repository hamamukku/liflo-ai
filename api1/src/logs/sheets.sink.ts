import { google, sheets_v4 } from "googleapis";
import type { ILogSink, LogRow } from "./index.js";

/**
 * SheetsSink writes audit events to a Google Sheets document. Each month
 * receives its own tab named using the configured prefix and the year/month.
 * The sink authenticates using a service account. It is designed to be used
 * behind a {@link LogQueue} to batch writes; writing individual rows one by
 * one will quickly exhaust the Sheets API quota.
 */
export class SheetsSink implements ILogSink {
  private readonly spreadsheetId: string;
  private readonly tabPrefix: string;
  private readonly authEmail: string;
  private readonly privateKey: string;
  private readonly client: any;
  private sheetsService: sheets_v4.Sheets | null = null;

  /**
   * Create a new SheetsSink.
   *
   * @param spreadsheetId ID of the Google Sheets document to write logs to.
   * @param tabPrefix Prefix for the tab names (e.g. 'logs_'); year and month
   *        will be appended automatically.
   * @param authEmail Service account email used to authenticate.
   * @param privateKey Private key for the service account (PEM format).
   */
  constructor(
    spreadsheetId: string,
    tabPrefix: string,
    authEmail: string,
    privateKey: string,
  ) {
    this.spreadsheetId = spreadsheetId;
    this.tabPrefix = tabPrefix;
    this.authEmail = authEmail;
    this.privateKey = privateKey;
    // Initialise a JWT client for Google APIs. The googleapis library will
    // throw if credentials are invalid or missing. We defer Sheets API
    // construction until the first write to avoid unnecessary overhead.
    this.client = new google.auth.JWT({
      email: this.authEmail,
      key: this.privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  /** Lazily construct a Sheets API client. */
  private get sheets(): sheets_v4.Sheets {
    if (!this.sheetsService) {
      this.sheetsService = google.sheets({ version: 'v4', auth: this.client });
    }
    return this.sheetsService;
  }

  /**
   * Ensure a tab exists for the given date. Tabs are named using the prefix
   * passed to the constructor followed by YYYY_MM (e.g. 'logs_2025_10').
   *
   * @param date Date used to derive the tab name.
   * @returns The tab title that has been ensured.
   */
  private async ensureTabForDate(date: Date): Promise<string> {
    const title = `${this.tabPrefix}${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`;
    // Check existing sheets for a matching title. A single call returns all
    // sheets with basic properties; this is inexpensive relative to a write.
    const spreadsheet = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });
    const exists = spreadsheet.data.sheets?.some(
      (s) => s.properties?.title === title,
    );
    if (exists) {
      return title;
    }
    // Create the sheet if it does not exist. The batchUpdate API allows
    // multiple modifications in one call; here we simply add a single sheet.
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title,
              },
            },
          },
        ],
      },
    });
    return title;
  }

  /**
   * Append a batch of log rows to Google Sheets. The sink determines the
   * correct tab based on the current date; all rows are written to the same
   * tab. If no rows are provided, the promise resolves immediately.
   *
   * @param rows Events to append.
   */
  async append(rows: LogRow[]): Promise<void> {
    if (!rows || rows.length === 0) {
      return;
    }
    // Use the timestamp of the first event to determine which tab to target.
    const timestamp = rows[0].ts ? new Date(rows[0].ts) : new Date();
    const tab = await this.ensureTabForDate(timestamp);
    // Map LogRow objects to arrays of primitive values in a stable order.
    const values: (string | number)[][] = rows.map((r) => [
      r.ts,
      r.requestId ?? '',
      r.userId ?? '',
      r.endpoint,
      r.method,
      r.event,
      r.status,
      r.latencyMs ?? '',
      r.ip ?? '',
      r.ua ?? '',
      r.note ?? '',
      r.goalId ?? '',
      r.recordId ?? '',
      r.date ?? '',
      r.statusCode ?? '',
      r.challengeU ?? '',
      r.skillU ?? '',
      r.aiChallenge ?? '',
      r.aiSkill ?? '',
    ]);
    // Perform the append. We always append to column A; the API will
    // automatically expand the sheet as necessary.
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });
  }
}
