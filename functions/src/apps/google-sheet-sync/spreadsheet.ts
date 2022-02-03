import * as functions from "firebase-functions";

const reg = new RegExp("^https://docs.google.com/spreadsheets/d/([\\w-]+)/.*$", );

export function getSpreadsheetId(spreadsheetUrl: string): string {
  const match = spreadsheetUrl.match(reg);

  if (!match) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid Google Spreadsheet URL. Please check and try again.",
    );
  }

  return match[1];
}
