import { getAuth } from "firebase/auth";
import { useContext } from "react";
import Context from "../../Context";
import Header from "../../Components/Headers";
import GoogleAuthButton from "./GoogleAuthButton";
import SyncSheetButton from "./SyncSheetButton";
import { useAuthState } from "react-firebase-hooks/auth";

export default function GoogleAsyncMultiStep() {
    const [user, loadingUser, _errorLoadingUser] = useAuthState(getAuth());
    const { linkSuccess, isItemAccess } = useContext(Context);

    if (!linkSuccess || !isItemAccess) {
        return <div>
            <div>Connect with your financial account to countinue</div>
        </div>
    }
    else if (loadingUser) {
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
