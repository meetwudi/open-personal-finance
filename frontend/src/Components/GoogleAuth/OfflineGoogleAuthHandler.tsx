import { getAuth } from "firebase/auth";
import { useEffect, useMemo } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { ffReceiveGoogleOauthCode } from "../../firebase-functions";

function useQuery() {
  const { search } = useLocation();

  return useMemo(() => new URLSearchParams(search), [search]);
}

/**
 * Receive OAuth callback code and associate the user's UID with
 * the code.
 */
export default function OfflineGoogleAuthHandler(): JSX.Element {
  const code = useQuery().get("code");
  const navigate = useNavigate();
  const [user, _loadingUser, _errorUser] = useAuthState(getAuth());

  useEffect(() => {
    if (user == null || code == null) {
      return;
    }

    ffReceiveGoogleOauthCode(code)
      .then(() => navigate("/", { replace: true }));
  }, [code, navigate, user]);

  if (code == null) {
    return <div></div>;
  }

  return <div>Loading ...</div>;
}
