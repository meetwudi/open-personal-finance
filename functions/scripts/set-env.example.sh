#!/bin/sh

firebase functions:config:set \
    plaid.client_id="61f223e81039fb0019529117" \
    plaid.client_secret="80952790990b0857efe06d7b059e11" \
    plaid.env="sandbox" \
    plaid.products="auth,transactions" \
    plaid.country_codes="US,CA" \
    plaid.oauth_redirect_uri=""   