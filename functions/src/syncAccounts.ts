import * as admin from "firebase-admin";
import { TransactionsGetResponse } from "plaid";
import { COLLECTION_PLAID_FINANCIAL_ACCOUNTS } from "./constants";
import { ExecutionContext } from "./execution-context";

export default async function syncAccounts(
  txnGetResp: TransactionsGetResponse,
  ctx: ExecutionContext,
): Promise<void> {
  const claims = await admin.auth().verifyIdToken(ctx.idToken);
  const collection = admin.firestore().collection(COLLECTION_PLAID_FINANCIAL_ACCOUNTS);

  await admin.firestore().runTransaction(async (db) => {
    // Delete existing accounts
    const existingDocsQuery = collection.where("uid", "==", claims.uid);
    const existingDocs = await db.get(existingDocsQuery);
    existingDocs.docs.forEach((doc) => db.delete(doc.ref));

    // New documents
    const docs = txnGetResp.accounts.map((acc) => ({
      uid: claims.uid,
      accountId: acc.account_id,
      name: acc.name,
      officialName: acc.official_name,
      type: acc.type,
    }));

    docs.forEach((doc) => db.create(collection.doc(), doc));
  });
}
