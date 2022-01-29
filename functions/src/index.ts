import * as functions from "firebase-functions";
import { LinkTokenCreateRequest, Products } from "plaid";
import { getPlaidClient, PLAID_ANDROID_PACKAGE_NAME, PLAID_COUNTRY_CODES, PLAID_PRODUCTS, PLAID_REDIRECT_URI } from "./plaid";

exports.createLinkToken = functions.https.onRequest(async (req, resp) => {
    const client = getPlaidClient();
    const configs: LinkTokenCreateRequest = {
        user: {
            // This should correspond to a unique id for the current user.
            client_user_id: 'user-id',
        },
        client_name: 'Plaid Quickstart',
        products: PLAID_PRODUCTS,
        country_codes: PLAID_COUNTRY_CODES,
        language: 'en',
    };

    if (PLAID_REDIRECT_URI !== '') {
        configs.redirect_uri = PLAID_REDIRECT_URI;
    }

    if (PLAID_ANDROID_PACKAGE_NAME !== '') {
        configs.android_package_name = PLAID_ANDROID_PACKAGE_NAME;
    }
    const createTokenResponse = await client.linkTokenCreate(configs);
    resp.json(createTokenResponse.data);
});

exports.setAccessToken = functions.https.onRequest(async (req, resp) => {
    const client = getPlaidClient();
    const tokenResponse = await client.itemPublicTokenExchange({
        public_token: req.body.public_token,
    });

    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;

    // FIXME: This needs to be stored in Firestore and shouldn't be exposed 
    //        to the client side.
    resp.json({
        access_token: accessToken,
        item_id: itemId,
        error: null,
    });
})