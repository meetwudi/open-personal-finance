import { User } from "firebase/auth";
import { collection, DocumentData, getFirestore, query, where } from "firebase/firestore";
import { CollectionHook, useCollection } from "react-firebase-hooks/firestore";
import { COLLECTION_APP_GSS_SETTINGS } from "./collections";

export default function useSettings(user: User): CollectionHook<DocumentData> {
  return useCollection(
    query(
      collection(getFirestore(), COLLECTION_APP_GSS_SETTINGS),
      where("uid", "==", user.uid)
    )
  );
}
