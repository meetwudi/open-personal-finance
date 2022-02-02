#!/bin/sh

# FIXME: Not all cloud functions need everything below.
firebase functions:config:set \
    plaid.client_id="<plaid_client_id>" \
    plaid.client_secret="<plaid_client_secret>" \
    plaid.env="sandbox" \
    plaid.products="auth,transactions" \
    plaid.country_codes="US,CA" \
    plaid.oauth_redirect_uri="" \
    google.client_id="<google_client_id>" \
    google.client_secret="<google_client_secret>" \
    google.redirect_uri="http://localhost:3000/google_auth_handler"