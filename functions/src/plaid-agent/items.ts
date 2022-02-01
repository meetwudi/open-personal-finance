import * as admin from "firebase-admin";
import { COLLECTION_PLAID_ITEM } from "./collections";

export function queryByUidAndInstitution(
  uid: string,
  institutionId: string,
): FirebaseFirestore.Query {
  return admin.firestore().collection(COLLECTION_PLAID_ITEM)
    .where("uid", "==", uid)
    .where("institutionId", "==", institutionId);
}

export function queryByUid(
  uid: string
): FirebaseFirestore.Query {
  return admin.firestore().collection(COLLECTION_PLAID_ITEM)
    .where("uid", "==", uid);
}

