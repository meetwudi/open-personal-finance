import * as functions from "firebase-functions";

export const GOOGLE_CLIENT_ID: string = functions.config().google.client_id;
export const GOOGLE_CLIENT_SECRET: string = functions.config().google.client_secret;
export const GOOGLE_REDIRECT_URI: string = functions.config().google.redirect_uri;

if (typeof GOOGLE_CLIENT_ID !== "string" ||
    typeof GOOGLE_CLIENT_SECRET !== "string" ||
    typeof GOOGLE_REDIRECT_URI !== "string") {
  throw new Error("Either GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET or GOOGLE_REDIRECT_URI is not initialized");
}
