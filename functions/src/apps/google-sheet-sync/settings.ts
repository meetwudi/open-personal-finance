import * as admin from "firebase-admin";
import { first } from "lodash";
import { COLLECTION_APP_GSS_SETTINGS } from "./collections";
import { Column } from "./columns";

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

export async function getEnabledColumns(idToken: string): Promise<Column[]> {
  const doc = await getUserSettings(idToken);
  return doc?.data().enabledColumns;
}
