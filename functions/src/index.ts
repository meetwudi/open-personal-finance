import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { LinkTokenCreateRequest } from "plaid";
import {
  getAccessToken,
  getPlaidClient,
  getTransactions,
  PLAID_ANDROID_PACKAGE_NAME,
  PLAID_COUNTRY_CODES,
  PLAID_PRODUCTS,
  PLAID_REDIRECT_URI,
  setAccessToken
} from "./plaid";
import { saveSocialAuthToken } from "./social-auth";

import { TEMP_ITEM_ID, TEMP_UID } from "./constants";
import { syncGoogleSheetPipeline } from "./pipelines";

admin.initializeApp();

exports.getInfo = functions.https.onCall(async () => {
  const accessToken = await getAccessToken(TEMP_UID, TEMP_ITEM_ID);

  return {
    item_id: TEMP_ITEM_ID,
    access_token: accessToken,
    products: PLAID_PRODUCTS,
  };
});

exports.createLinkToken = functions.https.onCall(async () => {
  const client = getPlaidClient();
  const configs: LinkTokenCreateRequest = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: TEMP_UID,
    },
    client_name: "OpenTxSync",
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

exports.setAccessToken = functions.https.onCall(async (params) => {
  const client = getPlaidClient();
  const tokenResponse = await client.itemPublicTokenExchange({
    public_token: params.public_token,
  });

  const accessToken = tokenResponse.data.access_token;
  const itemId = tokenResponse.data.item_id;

  await setAccessToken(TEMP_UID, TEMP_ITEM_ID, accessToken);

  // FIXME: This needs to be stored in Firestore and shouldn't be exposed
  //        to the client side.
  return {
    access_token: accessToken,
    item_id: itemId,
    error: null,
  };
});

exports.getTransactions = functions.https.onCall(getTransactions);

exports.saveSocialAuthToken = functions.https.onCall(async (params) => {
  await saveSocialAuthToken(
    TEMP_UID,
    params.providerId,
    params.accessToken,
  );
});

exports.syncSheet = functions.https.onCall(async (params) => {
  const txnGetResp = await getTransactions();
  const op = await syncGoogleSheetPipeline(txnGetResp);
  await op.run(params.idToken);
});
