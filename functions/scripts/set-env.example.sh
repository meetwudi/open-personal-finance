#!/bin/sh

firebase functions:config:set \
    plaid.client_id="<plaid_client_id>" \
    plaid.client_secret="<plaid_client_secret>" \
    plaid.env="sandbox" \
    plaid.products="auth,transactions" \
    plaid.country_codes="US,CA" \
    plaid.oauth_redirect_uri=""   