import * as admin from "firebase-admin";
import { TransactionsGetResponse } from "plaid";
import { ExecutionContext } from "../execution-context";
import { COLLECTION_PLAID_FINANCIAL_ACCOUNTS } from "./collections";

export async function syncAccounts(
  txnGetResp: TransactionsGetResponse,
  ctx: ExecutionContext,
): Promise<void> {
  const claims = await admin.auth().verifyIdToken(ctx.idToken);
  const collection = admin.firestore().collection(COLLECTION_PLAID_FINANCIAL_ACCOUNTS);

  await admin.firestore().runTransaction(async (db) => {
    const existingDocsQuery = collection.where("uid", "==", claims.uid);
    const existingDocs = await db.get(existingDocsQuery);
    const existingAccountIds = new Set(existingDocs.docs.map((account) => account.data().accountId));
    const newAccountIds = new Set(txnGetResp.accounts.map((account) => account.account_id));

    // Add new accounts
    txnGetResp.accounts
      .filter((account) => !existingAccountIds.has(account.account_id))
      .map((acc) => ({
        uid: claims.uid,
        accountId: acc.account_id,
        name: acc.name,
        officialName: acc.official_name,
        type: acc.type,
        rawAccount: acc,
      }))
      .forEach((doc) => db.create(collection.doc(), doc));

    // Delete accounts that no longer exist
    existingDocs.docs.filter(
      (doc) => !newAccountIds.has(doc.data().accountId)
    ).forEach((doc) => db.delete(doc.ref));
  });
}
