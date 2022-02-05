import * as admin from "firebase-admin";
import { first } from "lodash";
import { COLLECTION_APP_GSS_SETTINGS } from "./collections";

async function getUserSettings(
  uid: string
): Promise<FirebaseFirestore.QueryDocumentSnapshot | undefined> {
  const result = await admin.firestore()
    .collection(COLLECTION_APP_GSS_SETTINGS)
    .where("uid", "==", uid)
    .get();

  return first(result.docs);
}

export async function isEnabled(uid: string): Promise<boolean> {
  const settings = await getUserSettings(uid);
  return settings?.data().isEnabled ?? false;
}

export async function getSpreadsheetUrl(uid: string): Promise<string | null> {
  const settings = await getUserSettings(uid);
  return settings?.data().spreadsheetUrl ?? null;
}

export async function getSheetName(uid: string): Promise<string> {
  const settings = await getUserSettings(uid);
  return settings?.data().sheetName ?? "Sheet1";
}
