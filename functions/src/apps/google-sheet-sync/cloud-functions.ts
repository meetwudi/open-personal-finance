import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { google } from "googleapis";
import { flatten, sum } from "lodash";
import { TransactionsGetResponse } from "plaid";
import { ExecutionContext } from "../../execution-context";
import { getAuthenticatedClientX } from "../../google-auth";
import { getEnabledAccounts, getTransactions } from "../../plaid-agent";
import { dedupTransactions } from "../../plaid-agent/transactions";
import { getColumnName, getColumnValue } from "./columns";
import { getEnabledColumns } from "./settings";

export const ffSyncGoogleSheet = functions.https.onCall(async (params) => {
  const ctx = {idToken: params.idToken};
  const userClaims = await admin.auth().verifyIdToken(params.idToken);

  const txnGetResp = await getTransactions(userClaims.uid);
  await syncGoogleSheet(txnGetResp, ctx);
});

async function syncGoogleSheet(
  txnGetResps: TransactionsGetResponse[],
  ctx: ExecutionContext,
): Promise<void> {
  const userClaims = await admin.auth().verifyIdToken(ctx.idToken);
  const enabledAccounts = await getEnabledAccounts(userClaims.uid);
  const enabledAccountIds = new Set(enabledAccounts.map((doc) => doc.data().accountId));
  const txns = dedupTransactions(flatten(txnGetResps.map((r) => r.transactions)));
  const enabledColumns = await getEnabledColumns(ctx.idToken);

  const headers = enabledColumns.map(getColumnName);

  const values = txns
    .filter((txn) => enabledAccountIds.has(txn.account_id))
    .map((txn) => enabledColumns.map((column) => getColumnValue(column, txn)));

  functions.logger.info("syncGoogleSheet", {
    uid: userClaims.uid,
    countRows: values.length,
    totalTransactions: sum(txnGetResps.map((r) => r.transactions.length)),
    totalTransactionsDedup: txns.length,
    totalAccounts: sum(txnGetResps.map((r) => r.accounts.length)),
    enabledAccounts,
  });

  values.unshift(headers);

  const oauthClient = await getAuthenticatedClientX(ctx.idToken);

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
