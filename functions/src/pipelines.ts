import { google } from "googleapis";
import { TransactionsGetResponse } from "plaid";
import { TEMP_UID } from "./constants";
import { getSocialAuthToken } from "./social-auth";

type OperatorContext = {
    idToken: string,
}

interface RunnableOperator {
    run(ctx: OperatorContext): Promise<void>;
}

class GoogleSyncOperator implements RunnableOperator {
    // FIXME: typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _values: any[][];

    // FIXME: typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(values: any[][]) {
      this._values = values;
    }

    async run(ctx: OperatorContext) {
      const oauthClient = new google.auth.OAuth2();
      const accessToken = await getSocialAuthToken(TEMP_UID, "google.com");
      oauthClient.setCredentials({
        access_token: accessToken,
        id_token: ctx.idToken,
      });

      const sheetsApi = google.sheets({
        version: "v4",
        auth: oauthClient
      });

      const sheet = await sheetsApi.spreadsheets.create({
        requestBody: {}
      });

      await sheetsApi.spreadsheets.values.append({
        spreadsheetId: sheet.data.spreadsheetId,
        range: "Sheet1!A1:H1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          majorDimension: "ROWS",
          values: this._values,
        }
      });
    }
}

export async function syncGoogleSheetPipeline(
  txnGetResp: TransactionsGetResponse,
): Promise<RunnableOperator> {
  const headers = [
    "Name",
    "Category",
    "Date",
    "Amount",
    "Time",
    "Merchant"
  ];

  const values = txnGetResp.transactions.map((txn) => ([
    txn.name,
    (txn.category ?? []).join(","),
    txn.authorized_date,
    txn.amount,
    txn.authorized_datetime,
    txn.merchant_name,
  ]));
  values.unshift(headers);

  return new GoogleSyncOperator(values);
}
