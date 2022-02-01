import { getApp } from "firebase/app";
import { getAuth, getIdToken } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

export async function ffCreateLinkToken(): Promise<any> {
  const user = getAuth().currentUser;

  if (user == null) {
    throw new Error("User not logged in");
  }

  const idToken = await getIdToken(user);
  const functions = getFunctions(getApp());
  const fn = httpsCallable(functions, "createLinkToken");
  const result = await fn({ idToken });
  return result.data;
}

export async function ffSetAccessToken(publicToken: string): Promise<any> {
  const user = getAuth().currentUser;

  if (user == null) {
    throw new Error("User not logged in");
  }

  const idToken = await getIdToken(user);
  const functions = getFunctions(getApp());
  const fn = httpsCallable(functions, "setAccessToken");

  const result = await fn({idToken, publicToken});

  return result.data;
}

export async function ffGetTransactions(): Promise<any> {
  const functions = getFunctions(getApp());
  const fn = httpsCallable(functions, "getTransactions");
  const result = await fn();
  return result.data;
}

export async function ffSaveSocialAuthToken(
  providerId: string,
  accessToken: string,
): Promise<any> {
  const user = getAuth().currentUser;

  if (user == null) {
    throw new Error("User not logged in");
  }

  const idToken = await getIdToken(user);
  const functions = getFunctions(getApp());
  const fn = httpsCallable(functions, "saveSocialAuthToken");

  // FIXME: Pass idToken here
  const result = await fn({
    accessToken,
    providerId,
    idToken,
  });
  return result.data;
}

export async function ffPopulateData(): Promise<any> {
  const user = getAuth().currentUser;

  if (user == null) {
    throw new Error("User not logged in");
  }

  const idToken = await getIdToken(user);
  const functions = getFunctions(getApp());
  const fn = httpsCallable(functions, "populateData");
  const result = await fn({ idToken });
  console.log("ffPopulateData: Completed"); // FIXME: delete
  return result.data;
}

export async function ffUpdatePlaidAccountSettings(accountId: string, accountEnabledGlobally: boolean): Promise<any> {
  const user = getAuth().currentUser;

  if (user == null) {
    throw new Error("User not logged in");
  }

  const idToken = await getIdToken(user);
  const functions = getFunctions(getApp());
  const fn = httpsCallable(functions, "updatePlaidAccountSettings");
  const result = await fn({ idToken, accountId, accountEnabledGlobally });
  console.log(result);
  return result.data;
}
