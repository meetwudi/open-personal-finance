import { google } from "googleapis";
import { TransactionsGetResponse } from "plaid";
import { TEMP_UID } from "./constants";
import dedupTransactions from "./dedupTransactions";
import { ExecutionContext } from "./execution-context";
import { getSocialAuthToken } from "./social-auth";

export default async function syncGoogleSheet(
  txnGetResp: TransactionsGetResponse,
  ctx: ExecutionContext,
): Promise<void> {
  const txns = dedupTransactions(txnGetResp.transactions);

  const headers = [
    "Name",
    "Category",
    "Date",
    "Amount",
    "Time",
    "Merchant"
  ];

  const values = txns.map((txn) => ([
    txn.name,
    (txn.category ?? []).join(","),
    txn.authorized_date,
    txn.amount,
    txn.authorized_datetime,
    txn.merchant_name,
  ]));
  values.unshift(headers);

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
      values,
    }
  });
}
