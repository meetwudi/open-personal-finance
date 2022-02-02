import * as admin from "firebase-admin";
import { find, first } from "lodash";
import { getGoogleOAuthClient } from "./client";
import { COLLECTION_GOOGLE_AUTH_CREDENTIALS } from "./collections";

// FIXME: Automatically call refreshTokens from a cloud task
//        before the accessToken expires.

// FIXME: Call refreshTokens when an API call fails, or figure out a
//        way to send a preflight request to verify tokens

/**
 * Attempt to refresh google access token for a specific user
 *
 * @returns {boolean} Whether or not an access token was refreshed
 */
export async function refreshTokens(idToken: string): Promise<boolean> {
  const userClaims = await admin.auth().verifyIdToken(idToken);
  const tokenQueryResult = await admin.firestore().collection(COLLECTION_GOOGLE_AUTH_CREDENTIALS)
    .where("uid", "==", userClaims.uid)
    .get();

  const tokenDoc = find(tokenQueryResult.docs, (doc) => typeof doc.data().refresh_token === "string");
  if (tokenDoc == null) {
    return false;
  }

  const client = getGoogleOAuthClient();
  client.setCredentials(tokenDoc.data());

  // refreshAccessToken might not be deprecated
  // See also: https://github.com/googleapis/google-auth-library-nodejs/issues/1355
  const newTokens = await client.refreshAccessToken();
  await tokenDoc.ref.update(newTokens);

  return true;
}

export async function getTokens(
  // FIXME: Some APIs use uid while others use idToken. Figure out a safe and consistent way
  //        to pass this info around.
  idToken: string,
): Promise<FirebaseFirestore.DocumentData | undefined> {
  const userClaims = await admin.auth().verifyIdToken(idToken);
  const collection = admin.firestore().collection(COLLECTION_GOOGLE_AUTH_CREDENTIALS);
  const queryResult = await collection.where("uid", "==", userClaims.uid)
    .get();

  return first(queryResult.docs)?.data();
}
