import { collection, DocumentData, getFirestore, query, where } from "firebase/firestore";
import { CollectionHook, useCollection } from "react-firebase-hooks/firestore";
import { COLLECTION_PLAID_FINANCIAL_ACCOUNTS } from "./constants";

export default function usePlaidAccounts(uid: string): CollectionHook<DocumentData> {
  return useCollection(
    query(
      collection(getFirestore(), COLLECTION_PLAID_FINANCIAL_ACCOUNTS),
      where("uid", "==", uid),
    )
  );
}
