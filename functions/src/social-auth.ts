import * as admin from "firebase-admin";
import { first } from "lodash";

export async function getSocialAuthToken(
  uid: string,
  providerId: string,
): Promise<string | null> {
  const collection = admin.firestore().collection("social_auth_tokens");
  const queryResult = await collection.where("uid", "==", uid)
    .where("providerId", "==", providerId)
    .get();

  return first(queryResult.docs)?.data()?.accessToken;
}

export async function saveSocialAuthToken(
  uid: string,
  providerId: string,
  accessToken: string,
): Promise<void> {
  const collection = admin.firestore().collection("social_auth_tokens");
  await admin.firestore().runTransaction(async (txn) => {
    const existingDocsQuery = collection
      .where("uid", "==", uid)
      .where("providerId", "==", providerId);
    const existingDocs = await txn.get(existingDocsQuery);

    if (existingDocs.size > 0) {
      existingDocs.docs.forEach((doc) => txn.update(doc.ref, {
        uid, providerId, accessToken,
      }));
    } else {
      txn.create(collection.doc(), {
        uid, providerId, accessToken,
      });
    }
  });
}
