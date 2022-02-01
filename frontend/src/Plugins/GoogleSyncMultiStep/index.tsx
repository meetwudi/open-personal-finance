import { getAuth } from "firebase/auth";
import GoogleAuthButton from "./GoogleAuthButton";
import SyncSheetButton from "./SyncSheetButton";
import { useAuthState } from "react-firebase-hooks/auth";

export default function GoogleAsyncMultiStep() {
    const [user, loadingUser, _errorLoadingUser] = useAuthState(getAuth());

    if (loadingUser) {
        return <div>Loading user ...</div>
    } else if (user == null) {
        return <GoogleAuthButton />;
    } else {
        return <div>
            <GoogleAuthButton />
            <SyncSheetButton />
        </div>;
    }
}
