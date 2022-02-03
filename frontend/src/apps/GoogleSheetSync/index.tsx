import { getAuth } from "firebase/auth";
import SyncSheetButton from "./SyncSheetButton";
import { useAuthState } from "react-firebase-hooks/auth";
import OfflineGoogleAuthButton from "../../Components/GoogleAuth/OfflineGoogleAuthButton";
import AuthenticatedOnly from "../../Components/AuthenticatedOnly";
import Settings from "./Settings";

export default function GoogleSheetSync() {
  const [user, _loadingUser, _errorLoadingUser] = useAuthState(getAuth());

  if (user == null) {
    return null;
  }

  return <AuthenticatedOnly>
    { (user) =>
      (<>
        <Settings user={user} />
        <OfflineGoogleAuthButton
          user={user}
          scope="https://www.googleapis.com/auth/spreadsheets" />
        <SyncSheetButton />
      </>)
    }
  </AuthenticatedOnly>;
}
