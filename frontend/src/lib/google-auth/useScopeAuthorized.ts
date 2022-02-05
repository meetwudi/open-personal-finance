import { User } from "firebase/auth";
import { collection, FirestoreError, getFirestore, query, where } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { LoadingHook } from "react-firebase-hooks/firestore/dist/util";
import { COLLECTION_GOOGLE_AUTH_CREDENTIALS } from "./constants";

/**
 * Checks whether or not a scope is authorized to the Google
 * access token.
 */
export default function useScopeAuthorized(
  user: User,
  scope: string | string[] | undefined | null,
): LoadingHook<boolean, FirestoreError | Error> {
  const [tokens, loadingTokens, errorTokens] = useCollection(
    query(
      collection(getFirestore(), COLLECTION_GOOGLE_AUTH_CREDENTIALS),
      where("uid", "==", user.uid),
    ),
  );

  if (scope == null) {
    return [true, false, undefined];
  }

  if (loadingTokens) {
    return [undefined, true, errorTokens];
  }

  if (errorTokens) {
    return [undefined, false, errorTokens];
  }

  if (tokens == null || tokens?.empty) {
    return [false, false, errorTokens];
  }

  const token = tokens.docs[0];
  const tokenScope = token.data().scope;

  if (typeof tokenScope !== "string") {
    return [false, false, new Error("scope is not a valid string")];
  }

  const hasScope = typeof scope === "string" ?
    tokenScope.includes(scope) === true :
    scope.every((s) => tokenScope.includes(s));

  return [
    hasScope,
    false,
    undefined,
  ];
}
