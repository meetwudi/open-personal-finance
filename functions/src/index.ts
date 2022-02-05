import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { LinkTokenCreateRequest } from "plaid";
import { ffSyncGoogleSheet } from "./apps/google-sheet-sync";
import { ffSyncGoogleSheetSchedule } from "./apps/google-sheet-sync/cloud-functions";
import { PRODUCT_CODE_NAME } from "./constants";
import { ffGetGoogleOauthLink, ffReceiveGoogleOauthCode } from "./google-auth";
import {
  setAccessToken,
  syncAccounts,
  getPlaidClient,
  getTransactions,
  PLAID_ANDROID_PACKAGE_NAME,
  PLAID_COUNTRY_CODES,
  PLAID_PRODUCTS,
  PLAID_REDIRECT_URI
} from "./plaid-agent";
import { COLLECTION_PLAID_FINANCIAL_ACCOUNTS } from "./plaid-agent/collections";

admin.initializeApp();

/**
 * @param {string} params.uid
 */
exports.createLinkToken = functions.https.onCall(async (params) => {
  const client = getPlaidClient();
  const userClaims = await admin.auth().verifyIdToken(params.idToken);

  const configs: LinkTokenCreateRequest = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: userClaims.uid,
    },
    client_name: PRODUCT_CODE_NAME,
    products: PLAID_PRODUCTS,
    country_codes: PLAID_COUNTRY_CODES,
    language: "en",
  };

  if (PLAID_REDIRECT_URI !== "") {
    configs.redirect_uri = PLAID_REDIRECT_URI;
  }

  if (PLAID_ANDROID_PACKAGE_NAME !== "") {
    configs.android_package_name = PLAID_ANDROID_PACKAGE_NAME;
  }
  const createTokenResponse = await client.linkTokenCreate(configs);
  return createTokenResponse.data;
});


/**
 * Params:
 * @param {string} params.idToken
 * @param {string} params.publicToken - The public token used to exchange for an access token
 */
exports.setAccessToken = functions.https.onCall(async (params) => {
  const client = getPlaidClient();
  const tokenResponse = await client.itemPublicTokenExchange({
    public_token: params.publicToken,
  });

  const accessToken = tokenResponse.data.access_token;
  const itemId = tokenResponse.data.item_id;
  const userClaims = await admin.auth().verifyIdToken(params.idToken);

  await setAccessToken(userClaims.uid, itemId, accessToken);

  // FIXME: This needs to be stored in Firestore and shouldn't be exposed
  //        to the client side.
  return {
    access_token: accessToken,
    item_id: itemId,
    error: null,
  };
});

/**
 * Trigger various sync operations
 *
 * @param {string} params.idToken
 */
exports.populateData = functions.https.onCall(async (params) => {
  const ctx = {idToken: params.idToken};
  const userClaims = await admin.auth().verifyIdToken(params.idToken);
  const txnGetResp = await getTransactions(userClaims.uid);

  await syncAccounts(
    txnGetResp,
    ctx,
  );
});

// FIXME: I don't think this deserves a separate cloud function, but maybe
//        make settings a writable sub-collection so it can be updated from
//        the client.
exports.updatePlaidAccountSettings = functions.https.onCall(async (params) => {
  const {idToken, accountId, accountEnabledGlobally} = params;
  const claims = await admin.auth().verifyIdToken(idToken);

  await admin.firestore().runTransaction(async (db) => {
    const collection = admin.firestore()
      .collection(COLLECTION_PLAID_FINANCIAL_ACCOUNTS);
    const existingDocs = await db.get(collection
      .where("uid", "==", claims.uid)
      .where("accountId", "==", accountId));

    if (existingDocs.empty) {
      throw new functions.https.HttpsError("not-found", "account not found", {
        accountId,
        uid: claims.uid,
      });
    }

    existingDocs.forEach(
      (doc) => db.update(doc.ref, {accountEnabledGlobally}));
  });
});

// google-auth
exports.ffGetGoogleOauthLink = ffGetGoogleOauthLink;
exports.ffReceiveGoogleOauthCode = ffReceiveGoogleOauthCode;

// apps/google-sheet-sync
exports.ffSyncGoogleSheet = ffSyncGoogleSheet;
exports.ffSyncGoogleSheetSchedule = ffSyncGoogleSheetSchedule;
