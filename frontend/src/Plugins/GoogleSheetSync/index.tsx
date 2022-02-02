import { getAuth } from "firebase/auth";
import SyncSheetButton from "./SyncSheetButton";
import { useAuthState } from "react-firebase-hooks/auth";
import OfflineGoogleAuthButton from "../../Components/GoogleAuth/OfflineGoogleAuthButton";

export default function GoogleSheetSync() {
  const [user, _loadingUser, _errorLoadingUser] = useAuthState(getAuth());

  if (user == null) {
    return null;
  }

  return <div>
    <OfflineGoogleAuthButton />
    <SyncSheetButton />
  </div>;
}
