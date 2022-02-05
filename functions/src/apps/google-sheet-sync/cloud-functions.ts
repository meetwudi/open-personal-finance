import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { google } from "googleapis";
import { flatten, sum } from "lodash";
import { getAuthenticatedClientX } from "../../google-auth";
import { getEnabledAccounts, getTransactions } from "../../plaid-agent";
import { dedupTransactions } from "../../plaid-agent/transactions";
import { transformCategories } from "../../transaction-category-transformations";
import { Column, getColumnName, getColumnValue } from "./columns";
import { getSheetName, getSpreadsheetUrl, isEnabled } from "./settings";
import { getSpreadsheetId } from "./spreadsheet";

export const ffSyncGoogleSheetSchedule = functions.pubsub.schedule("every 5 minutes").onRun(
  async () => {
  // FIXME: Only 1000 users will be fetched. Implement paging.
    const listUsersResp = await admin.auth().listUsers();
    await Promise.all(listUsersResp.users.map((user) => syncGoogleSheet(user.uid)));
  });

export const ffSyncGoogleSheet = functions.https.onCall(async (params) => {
  const userClaims = await admin.auth().verifyIdToken(params.idToken);
  await syncGoogleSheet(userClaims.uid);
});

async function syncGoogleSheet(
  uid: string, // FIXME: Maybe pass User here so that we don't end up passing a wrong string as uid.
): Promise<void> {
  const txnGetResps = await getTransactions(uid);
  const enabled = await isEnabled(uid);

  if (!enabled) {
    return;
  }

  const enabledAccounts = await getEnabledAccounts(uid);
  const enabledAccountIds = new Set(enabledAccounts.map((doc) => doc.data().accountId));
  const txns = dedupTransactions(flatten(txnGetResps.map((r) => r.transactions)));
  const enabledColumns = Object.values(Column);
  const headers = enabledColumns.map(getColumnName);

  await Promise.all(txns.map((txn) => transformCategories(uid, txn)));

  const values = txns
    .filter((txn) => enabledAccountIds.has(txn.account_id))
    .map((txn) => enabledColumns.map((column) => getColumnValue(column, txn)));

  functions.logger.info("syncGoogleSheet", {
    uid,
    countRows: values.length,
    totalTransactions: sum(txnGetResps.map((r) => r.transactions.length)),
    totalTransactionsDedup: txns.length,
    totalAccounts: sum(txnGetResps.map((r) => r.accounts.length)),
    enabledAccounts,
  });

  values.unshift(headers);

  const oauthClient = await getAuthenticatedClientX(uid);
  const sheetsApi = google.sheets({
    version: "v4",
    auth: oauthClient
  });
  const spreadsheetUrl = await getSpreadsheetUrl(uid);
  const sheetName = await getSheetName(uid);

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
