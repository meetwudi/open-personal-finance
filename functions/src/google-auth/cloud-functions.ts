import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { getGoogleOAuthClient } from "./client";
import { COLLECTION_GOOGLE_AUTH_CREDENTIALS } from "./collections";

/**
 * Get an authorization link to Google services.
 *
 * @param {string} params.idToken
 */
export const ffGetGoogleOauthLink = functions.https.onCall(async (params) => {
  const userClaims = await admin.auth().verifyIdToken(params.idToken);
  const oauth2Client = getGoogleOAuthClient();

  return oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "offline",

    // If you only need one scope you can pass it as a string
    scope: params.scopes || [],

    include_granted_scopes: true,
    prompt: "consent",
    login_hint: userClaims.email,
  });
});

/**
 * Verify OAuth code, and associate the tokens with the given user
 *
 * @param {string} params.idToken
 * @param {string} params.code - OAuth code from Google
 */
export const ffReceiveGoogleOauthCode = functions.https.onCall(async (params) => {
  const oauth2Client = getGoogleOAuthClient();

  const { code } = params;
  if (typeof code !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "`code` is not a valid string");
  }

  const {tokens} = await oauth2Client.getToken(code);
  const userClaims = await admin.auth().verifyIdToken(params.idToken);

  if (tokens.refresh_token == null) {
    functions.logger.warn("ffReceiveGoogleOauthCode:missingRefreshToken", {
      uid: userClaims.uid,
    });
  }

  const doc = Object.assign({}, tokens, {
    uid: userClaims.uid,
  });

  await admin.firestore().collection(COLLECTION_GOOGLE_AUTH_CREDENTIALS)
    .add(doc);
});
