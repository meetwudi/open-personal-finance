import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { LinkTokenCreateRequest } from "plaid";
import {
  getAccessToken,
  getAccessTokenX,
  getPlaidClient,
  PLAID_ANDROID_PACKAGE_NAME,
  PLAID_COUNTRY_CODES,
  PLAID_PRODUCTS,
  PLAID_REDIRECT_URI
} from "./plaid";

import moment = require("moment");

admin.initializeApp();

const TEMP_UID = "temp-uid";

exports.getInfo = functions.https.onCall(async () => {
  const accessToken = await getAccessToken(TEMP_UID);

  return {
    item_id: "ITEM_ID",
    access_token: accessToken,
    products: PLAID_PRODUCTS,
  };
});

exports.createLinkToken = functions.https.onCall(async () => {
  const client = getPlaidClient();
  const configs: LinkTokenCreateRequest = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: "user-id",
    },
    client_name: "Plaid Quickstart",
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

  // FIXME: This needs to be stored in Firestore and shouldn't be exposed
  //        to the client side.
  return {
    access_token: accessToken,
    item_id: itemId,
    error: null,
  };
});

exports.getTransactions = functions.https.onCall(async () => {
  // Pull transactions for the Item for the last 30 days
  const startDate = moment().subtract(30, "days").format("YYYY-MM-DD");
  const endDate = moment().format("YYYY-MM-DD");
  const client = getPlaidClient();

  const accessToken = await getAccessTokenX(TEMP_UID);

  const configs = {
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
    options: {
      count: 250,
      offset: 0,
    },
  };
  const transactionsResponse = await client.transactionsGet(configs);
  return transactionsResponse.data;
});

