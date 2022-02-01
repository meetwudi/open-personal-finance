import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { first, flatten, range } from "lodash";
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products, TransactionsGetResponse } from "plaid";
import moment = require("moment");

const PLAID_CLIENT_ID = functions.config().plaid.client_id;
const PLAID_SECRET = functions.config().plaid.client_secret;
const PLAID_ENV = functions.config().plaid.env || "sandbox";

// PLAID_PRODUCTS is a comma-separated list of products to use when initializing
// Link. Note that this list must contain 'assets' in order for the app to be
// able to create and retrieve asset reports.
export const PLAID_PRODUCTS = (functions.config().plaid.products || "transactions").split(
  ",",
) as Products[]; // FIXME: Sketchy type casting without checks

// PLAID_COUNTRY_CODES is a comma-separated list of countries for which users
// will be able to select institutions from.
export const PLAID_COUNTRY_CODES = (functions.config().plaid.country_codes || "US").split(
  ",",
) as CountryCode[]; // FIXME: Sketchy type casting without checks

// Parameters used for the OAuth redirect Link flow.
//
// Set PLAID_REDIRECT_URI to 'http://localhost:3000'
// The OAuth redirect flow requires an endpoint on the developer's website
// that the bank website should redirect to. You will need to configure
// this redirect URI for your client ID through the Plaid developer dashboard
// at https://dashboard.plaid.com/team/api.
export const PLAID_REDIRECT_URI = functions.config().plaid.oauth_redirect_uri || "";

// Parameter used for OAuth in Android. This should be the package name of your app,
// e.g. com.plaid.linksample
export const PLAID_ANDROID_PACKAGE_NAME = functions.config().plaid.android_package_name || "";

export function getPlaidClient(): PlaidApi {
  const configuration = new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
        "PLAID-SECRET": PLAID_SECRET,
        "Plaid-Version": "2020-09-14",
      },
    },
  });
  return new PlaidApi(configuration);
}

export async function setAccessToken(
  uid: string,
  itemId: string,
  accessToken: string,
): Promise<void> {
  await admin.firestore()
    .collection("plaid_item_access_token")
    .doc(uid)
    .set({accessToken});

  await admin.firestore().runTransaction(async (txn) => {
    const existingDocQuery = admin.firestore()
      .collection("plaid_item_access_token")
      .where("uid", "==", uid)
      .where("itemId", "==", itemId);
    const existingDoc = await txn.get(existingDocQuery);

    if (existingDoc.docs.length > 0) {
      await Promise.all(existingDoc.docs.map((doc) => {
        txn.update(doc.ref, {
          accessToken
        });

        functions.logger.info("setAccessToken deleted item", {
          itemId: doc.data().itemId,
        });

        return getPlaidClient().itemRemove({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          access_token: doc.data().accessToken,
        });
      }));
    } else {
      txn.create(
        admin.firestore().collection("plaid_item_access_token").doc(),
        {
          accessToken,
          itemId,
          uid,
        }
      );
    }
  });
}

export async function getAccessToken(
  uid: string,
  itemId: string,
): Promise<string | null> {
  const queryResult = await admin.firestore()
    .collection("plaid_item_access_token")
    .where("uid", "==", uid)
    .where("itemId", "==", itemId)
    .get();

  return first(queryResult.docs)?.data().accessToken;
}

export async function getAccessTokenX(
  uid: string,
  itemId: string,
): Promise<string> {
  const accessToken = await getAccessToken(uid, itemId);

  if (typeof accessToken !== "string") {
    throw new functions.https.HttpsError(
      "internal",
      "accessToken not found",
    );
  }

  return accessToken;
}

export async function getTransactions(uid: string, itemId: string): Promise<TransactionsGetResponse> {
  // Pull transactions for the Item for the last 30 days
  const startDate = moment().subtract(30, "days").format("YYYY-MM-DD");
  const endDate = moment().format("YYYY-MM-DD");
  const client = getPlaidClient();
  const accessToken = await getAccessTokenX(uid, itemId);
  const configs = {
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
  };

  let responses: TransactionsGetResponse[] = [];
  const firstResponse = await client.transactionsGet(configs);
  const PAGE_SIZE = 500;
  responses.push(firstResponse.data);

  const missingTransactions = firstResponse.data.total_transactions - firstResponse.data.transactions.length;
  if (missingTransactions > 0) {
    const pages = Math.ceil(missingTransactions / PAGE_SIZE);

    functions.logger.info("getTransactions:fetchAdditionalPages", {
      uid,
      itemId,
      pages,
    });

    const moreResponses = await Promise.all(range(0, pages).map((pageId) => {
      return client.transactionsGet({
        ...configs,
        options: {
          offset: firstResponse.data.transactions.length + pageId * PAGE_SIZE,
          count: PAGE_SIZE,
        }
      });
    }));
    responses = responses.concat(moreResponses.map((r) => r.data));
  }

  const allTransactions = flatten(responses.map((r) => r.transactions));

  functions.logger.info("getTransactions", {
    uid,
    itemId,
    firstResponseTransactionsCount: firstResponse.data.transactions.length,
    firstResponseTotalTransactions: firstResponse.data.total_transactions,
    allTransactionsReturned: allTransactions.length,
  });

  return {
    ...firstResponse.data,
    transactions: allTransactions,
  };
}
