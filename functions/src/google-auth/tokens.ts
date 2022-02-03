import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { first } from "lodash";
import { COLLECTION_GOOGLE_AUTH_CREDENTIALS } from "./collections";
import { Credentials } from "google-auth-library";

// FIXME: Error handling when token refresh is broken

/**
 * Attempt to refresh google access token for a specific user
 *
 * @returns {boolean} Whether or not an access token was refreshed
 */
export async function updateTokens(
  oldTokens: FirebaseFirestore.DocumentReference,
  newCredentials: Credentials
): Promise<void> {
  await oldTokens.update(newCredentials);
}

export async function getTokens(
  // FIXME: Some APIs use uid while others use idToken. Figure out a safe and consistent way
  //        to pass this info around.
  idToken: string,
): Promise<FirebaseFirestore.QueryDocumentSnapshot | undefined> {
  const userClaims = await admin.auth().verifyIdToken(idToken);
  const collection = admin.firestore().collection(COLLECTION_GOOGLE_AUTH_CREDENTIALS);
  const queryResult = await collection.where("uid", "==", userClaims.uid)
    .get();

  return first(queryResult.docs);
}

export async function getTokensX(idToken: string): Promise<FirebaseFirestore.QueryDocumentSnapshot> {
  const tokens = await getTokens(idToken);
  const userClaims = await admin.auth().verifyIdToken(idToken);

  if (tokens == null) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Google access token not found",
      {
        uid: userClaims,
      });
  }

  return tokens;
}
