import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { google } from "googleapis";
import { flatten, sum } from "lodash";
import { TransactionsGetResponse } from "plaid";
import { ExecutionContext } from "../../execution-context";
import { getAuthenticatedClientX } from "../../google-auth";
import { getEnabledAccounts, getTransactions } from "../../plaid-agent";
import { dedupTransactions } from "../../plaid-agent/transactions";
import { transformCategories } from "../../transaction-category-transformations";
import { Column, getColumnName, getColumnValue } from "./columns";
import { getSheetName, getSpreadsheetUrl, isEnabled } from "./settings";
import { getSpreadsheetId } from "./spreadsheet";

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
  const enabled = await isEnabled(ctx.idToken);

  if (!enabled) {
    return;
  }

  const enabledAccounts = await getEnabledAccounts(userClaims.uid);
  const enabledAccountIds = new Set(enabledAccounts.map((doc) => doc.data().accountId));
  const txns = dedupTransactions(flatten(txnGetResps.map((r) => r.transactions)));
  const enabledColumns = Object.values(Column);
  const headers = enabledColumns.map(getColumnName);

  await Promise.all(txns.map((txn) => transformCategories(ctx.idToken, txn)));

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
  const sheetsApi = google.sheets({
    version: "v4",
    auth: oauthClient
  });
  const spreadsheetUrl = await getSpreadsheetUrl(ctx.idToken);
  const sheetName = await getSheetName(ctx.idToken);

  if (spreadsheetUrl == null) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Spreadsheet URL is not found",
    );
  }

  const spreadsheetId = getSpreadsheetId(spreadsheetUrl);

  await sheetsApi.spreadsheets.values.clear({
    spreadsheetId,
    range: sheetName // Wipe out the whole sheet
  });

  // FIXME: This doesn't create a sheet if sheetName doesn't exist
  await sheetsApi.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      majorDimension: "ROWS",
      values,
    }
  });
}
