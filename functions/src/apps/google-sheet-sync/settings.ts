import * as admin from "firebase-admin";
import { first } from "lodash";
import { COLLECTION_APP_GSS_SETTINGS } from "./collections";

async function getUserSettings(
  idToken: string
): Promise<FirebaseFirestore.QueryDocumentSnapshot | undefined> {
  const userClaims = await admin.auth().verifyIdToken(idToken);
  const result = await admin.firestore()
    .collection(COLLECTION_APP_GSS_SETTINGS)
    .where("uid", "==", userClaims.uid)
    .get();

  return first(result.docs);
}

export async function isEnabled(idToken: string): Promise<boolean> {
  const settings = await getUserSettings(idToken);
  return settings?.data().isEnabled ?? false;
}

export async function getSpreadsheetUrl(idToken: string): Promise<string | null> {
  const settings = await getUserSettings(idToken);
  return settings?.data().spreadsheetUrl ?? null;
}

export async function getSheetName(idToken: string): Promise<string> {
  const settings = await getUserSettings(idToken);
  return settings?.data().sheetName ?? "Sheet1";
}
