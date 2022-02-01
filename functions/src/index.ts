import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { LinkTokenCreateRequest } from "plaid";
import { COLLECTION_USER_ACCOUNT_SETTINGS, PRODUCT_CODE_NAME, TEMP_UID } from "./constants";
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
import { saveSocialAuthToken } from "./social-auth";
import syncGoogleSheet from "./syncGoogleSheet";


admin.initializeApp();

exports.createLinkToken = functions.https.onCall(async () => {
  const client = getPlaidClient();

  const configs: LinkTokenCreateRequest = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: TEMP_UID,
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

exports.saveSocialAuthToken = functions.https.onCall(async (params) => {
  const userClaims = await admin.auth().verifyIdToken(params.idToken);

  await saveSocialAuthToken(
    userClaims.uid,
    params.providerId,
    params.accessToken,
  );
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

  // Core syncs
  await syncAccounts(
    txnGetResp,
    ctx,
  );

  // Plugin syncs
  await syncGoogleSheet(
    txnGetResp, // FIXME: Plugin syncs should not access txnGetResp
    ctx,
  );
});

exports.updatePlaidAccountSettings = functions.https.onCall(async (params) => {
  const {idToken, accountId, accountEnabledGlobally} = params;
  const claims = await admin.auth().verifyIdToken(idToken);

  await admin.firestore().runTransaction(async (db) => {
    const collection = admin.firestore().collection(COLLECTION_USER_ACCOUNT_SETTINGS);
    const existingDocs = await db.get(collection
      .where("uid", "==", claims.uid)
      .where("accountId", "==", accountId));

    if (existingDocs.empty) {
      db.create(collection.doc(), {
        uid: claims.uid,
        accountId,
        accountEnabledGlobally,
      });
    } else {
      existingDocs.forEach(
        (doc) => db.update(doc.ref, {accountEnabledGlobally}));
    }
  });
});
