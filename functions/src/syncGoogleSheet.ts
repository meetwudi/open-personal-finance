import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { google } from "googleapis";
import { flatten, sum } from "lodash";
import { TransactionsGetResponse } from "plaid";
import { ExecutionContext } from "./execution-context";
import { getTokens } from "./google-auth";
import { getEnabledAccounts } from "./plaid-agent/accounts";
import { dedupTransactions } from "./plaid-agent/transactions";


export default async function syncGoogleSheet(
  txnGetResps: TransactionsGetResponse[],
  ctx: ExecutionContext,
): Promise<void> {
  const userClaims = await admin.auth().verifyIdToken(ctx.idToken);
  const enabledAccounts = await getEnabledAccounts(userClaims.uid);
  const enabledAccountIds = new Set(enabledAccounts.map((doc) => doc.data().accountId));
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
    .filter((txn) => enabledAccountIds.has(txn.account_id))
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
  const tokens = await getTokens(userClaims.uid);
  if (tokens == null) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Google access token not found",
      {
        uid: userClaims,
      });
  }

  oauthClient.setCredentials(tokens);
  // FIXME: Figure out how tokens can be refreshed
  // https://github.com/googleapis/google-api-nodejs-client#handling-refresh-tokens

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
