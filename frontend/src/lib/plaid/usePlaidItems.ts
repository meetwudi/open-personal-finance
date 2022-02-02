import { collection, DocumentData, getFirestore, query, where } from "firebase/firestore";
import { CollectionHook, useCollection } from "react-firebase-hooks/firestore";
import { COLLECTION_PLAID_ITEM } from "./constants";

export default function usePlaidItems(uid: string): CollectionHook<DocumentData> {
  return useCollection(
    query(
      collection(getFirestore(), COLLECTION_PLAID_ITEM),
      where("uid", "==", uid),
    )
  );
}
