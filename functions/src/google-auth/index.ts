import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { google } from "googleapis";
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

export const ffHasAccessTokenWithScope = functions.https.onCall(async () => {
  return false;
});

export const ffHandleOauthCode = functions.https.onRequest(async (req, res) => {
  const { code } = req.query;
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  );

  if (typeof code !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "`code` is not a valid string");
  }

  const {tokens} = await oauth2Client.getToken(code);
  const idToken = tokens.id_token;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = Object.assign({}, tokens);

  // FIXME: idToken might be used to link with a user but this is not working
  // properly at the moment. Figure out a way to link a firebase user with Google
  // auth token. Likely we need to do this handling logic on client side instead.
  if (idToken != null) {
    const userClaims = await admin.auth().verifyIdToken(idToken);
    doc.uid = userClaims.uid;
  }

  await admin.firestore().collection(COLLECTION_GOOGLE_AUTH_CREDENTIALS)
    .add(doc);

  res.send("ok").status(200);
});
