import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export async function initGoogleAuth(): Promise<void> {
  // Very naive implementation of Google Auth
  // FIXME: Refresh token is not available in this approach
  // FIXME: Scope is not verified

  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/spreadsheets");

  const auth = getAuth();
  await signInWithPopup(auth, provider);
}
