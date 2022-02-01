import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { google } from "googleapis";
import { flatten, sum } from "lodash";
import { TransactionsGetResponse } from "plaid";
import { TEMP_UID } from "./constants";
import { ExecutionContext } from "./execution-context";
import { dedupTransactions } from "./plaid-agent/transactions";
import { getEnabledAccounts } from "./plaid-agent/user-plaid-accounts";
import { getSocialAuthToken } from "./social-auth";


export default async function syncGoogleSheet(
  txnGetResps: TransactionsGetResponse[],
  ctx: ExecutionContext,
): Promise<void> {
  const userClaims = await admin.auth().verifyIdToken(ctx.idToken);
  const enabledAccounts = await getEnabledAccounts(userClaims.uid);
  const txns = dedupTransactions(flatten(txnGetResps.map((r) => r.transactions)));

  const headers = [
    "Name",
    "Category",
    "Date",
    "Amount",
    "Time",
    "Merchant",
    "Account ID"
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
      txn.account_id
    ]));

  functions.logger.info("syncGoogleSheet", {
    uid: userClaims.uid,
    countRows: values.length,
    totalTransactions: sum(txnGetResps.map((r) => r.transactions.length)),
    totalTransactionsDedup: txns.length,
    totalAccounts: sum(txnGetResps.map((r) => r.accounts.length)),
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
