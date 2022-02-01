import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { google } from "googleapis";
import { TransactionsGetResponse } from "plaid";
import { TEMP_UID } from "./constants";
import { ExecutionContext } from "./execution-context";
import { dedupTransactions } from "./plaid-agent/transactions";
import { getEnabledAccounts } from "./plaid-agent/user-plaid-accounts";
import { getSocialAuthToken } from "./social-auth";


export default async function syncGoogleSheet(
  txnGetResp: TransactionsGetResponse,
  ctx: ExecutionContext,
): Promise<void> {
  const userClaims = await admin.auth().verifyIdToken(ctx.idToken);
  const enabledAccounts = await getEnabledAccounts(userClaims.uid);
  const txns = dedupTransactions(txnGetResp.transactions);

  const headers = [
    "Name",
    "Category",
    "Date",
    "Amount",
    "Time",
    "Merchant"
  ];

  const values = txns
    .filter((txn) => enabledAccounts.has(txn.account_id))
    .map((txn) => ([
      txn.name,
      (txn.category ?? []).join(","),
      txn.authorized_date,
      txn.amount,
      txn.authorized_datetime,
      txn.merchant_name,
    ]));

  functions.logger.info("syncGoogleSheet", {
    uid: userClaims.uid,
    countRows: values.length,
    totalTransactions: txnGetResp.transactions.length,
    totalTransactionsDedup: txns.length,
    totalAccounts: txnGetResp.accounts.length,
    enabledAccounts,
  });

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
