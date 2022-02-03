import { User } from "firebase/auth";
import { useCallback } from "react";
import { ffGetGoogleOfflineAuthLink } from "../../firebase-functions";
import useScopeAuthorized from "../../lib/google-auth/useScopeAuthorized";

type Props = {
  user: User,
  scope?: string[] | string,
};

export default function OfflineGoogleAuthButton(props: Props): JSX.Element {
  const handleClick = useCallback(async () => {
    // FIXME: Pass scope to ffGetGoogleOfflineAuthLink
    const link = await ffGetGoogleOfflineAuthLink();
    window.location = link;
  }, []);
  const [
    hasScope,
    loadingHasScope,
    errorHasScope,
  ] = useScopeAuthorized(props.user, props.scope);

  return <button onClick={handleClick} disabled={hasScope || loadingHasScope}>
    {hasScope ? "Permission granted" : "Request permissions"}
  </button>;
}
