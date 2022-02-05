import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from "./constants";
import { google } from "googleapis";
import { getTokensX, updateTokens } from "./tokens";

export function getGoogleOAuthClient() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  );
}

export async function getAuthenticatedClientX(uid: string) {
  const client = getGoogleOAuthClient();
  const tokens = await getTokensX(uid);
  const existingAccessToken = tokens.data().access_token;
  client.setCredentials(tokens.data());

  await client.getAccessToken(); // Trigger potential token refresh
  if (
    client.credentials.access_token != null &&
    client.credentials.access_token !== existingAccessToken) {
    // The token was refreshed
    await updateTokens(tokens.ref, client.credentials);
  }

  return client;
}
