import * as admin from "firebase-admin";
import { COLLECTION_PLAID_ITEM } from "./collections";

export function queryExistingItems(
  uid: string,
  institutionId: string,
): FirebaseFirestore.Query {
  return admin.firestore().collection(COLLECTION_PLAID_ITEM)
    .where("uid", "==", uid)
    .where("institutionId", "==", institutionId);
}
