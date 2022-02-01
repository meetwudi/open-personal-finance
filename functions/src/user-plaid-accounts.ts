import * as admin from "firebase-admin";
import { COLLECTION_PLAID_FINANCIAL_ACCOUNTS, COLLECTION_USER_ACCOUNT_SETTINGS } from "./constants";

export async function getEnabledAccounts(
  uid: string,
): Promise<Set<string>> {
  // FIXME: This could be potentially very expensive (in terms of pricing) to run
  //        because it could might pull tens / hundreds of documents when
  //        a user has lot of accounts.
  const accountSettings = await admin.firestore()
    .collection(COLLECTION_USER_ACCOUNT_SETTINGS)
    .where("uid", "==", uid)
    .get();
  const accounts = await admin.firestore()
    .collection(COLLECTION_PLAID_FINANCIAL_ACCOUNTS)
    .where("uid", "==", uid)
    .get();

  const disabledAccounts = new Set(accountSettings.docs
    .filter((setting) => setting.data().accountEnabledGlobally === false)
    .map((setting) => setting.data().accountId));

  return new Set(accounts.docs
    .map((doc) => doc.data().accountId)
    .filter((accountId) => !disabledAccounts.has(accountId)));
}
