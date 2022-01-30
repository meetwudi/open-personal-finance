import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ffSaveSocialAuthToken } from "./firebase-functions";

export async function initGoogleAuth() {
    // Very naive implementation of Google Auth
    // FIXME: Refresh token is not available in this approach
    // FIXME: Scope is not verified

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');

    const auth = getAuth();
    const result = await signInWithPopup(auth, provider);

    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential == null) {
        throw new Error("Failed to authenticate to Google");
    }

    const accessToken = credential.accessToken;
    if (accessToken == null) {
        throw new Error("Failed to get Google accessToken");
    }

    await ffSaveSocialAuthToken(
        credential.providerId,
        accessToken,
    );
}
