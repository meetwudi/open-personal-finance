import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { google } from "googleapis";
import { first } from "lodash";
import { COLLECTION_GOOGLE_AUTH_CREDENTIALS } from "./collections";

const GOOGLE_CLIENT_ID: string = functions.config().google.client_id;
const GOOGLE_CLIENT_SECRET: string = functions.config().google.client_secret;
const GOOGLE_REDIRECT_URI: string = functions.config().google.redirect_uri;

if (typeof GOOGLE_CLIENT_ID !== "string" ||
    typeof GOOGLE_CLIENT_SECRET !== "string" ||
    typeof GOOGLE_REDIRECT_URI !== "string") {
  throw new Error("Either GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET or GOOGLE_REDIRECT_URI is not initialized");
}

export const ffGetGoogleOauthLink = functions.https.onCall(async (params) => {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  );

  return oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "offline",

    // If you only need one scope you can pass it as a string
    scope: params.scopes || [],
  });
});

export async function getGoogleAccessToken(
  // FIXME: Some APIs use uid while others use idToken. Figure out a safe and consistent way
  //        to pass this info around.
  uid: string,
): Promise<any> {
  const collection = admin.firestore().collection(COLLECTION_GOOGLE_AUTH_CREDENTIALS);
  const queryResult = await collection.where("uid", "==", uid)
    .get();

  return first(queryResult.docs)?.data();
}

export const ffHasAccessTokenWithScope = functions.https.onCall(async () => {
  return false;
});

/**
 * Verify OAuth code, and associate the tokens with the given user
 *
 * @param {string} params.idToken
 * @param {string} params.code - OAuth code from Google
 */
export const ffReceiveGoogleOauthCode = functions.https.onCall(async (params) => {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  );

  const { code } = params;
  if (typeof code !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "`code` is not a valid string");
  }

  const {tokens} = await oauth2Client.getToken(code);
  const userClaims = await admin.auth().verifyIdToken(params.idToken);

  const doc = Object.assign({}, tokens, {
    uid: userClaims.uid,
  });

  await admin.firestore().runTransaction(async (db) => {
    const credentialsCollection = admin.firestore().collection(COLLECTION_GOOGLE_AUTH_CREDENTIALS);
    const existingTokens = await db.get(credentialsCollection
      .where("uid", "==", userClaims.uid));

    existingTokens.docs.forEach((doc) => db.delete(doc.ref));

    db.create(
      credentialsCollection.doc(),
      doc,
    );
  });
});
