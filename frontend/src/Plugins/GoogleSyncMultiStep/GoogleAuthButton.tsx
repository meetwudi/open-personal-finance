import { initGoogleAuth } from "../../google-auth";

export default function GoogleAuthButton() {
    return <button onClick={() => initGoogleAuth()}>Google Auth</button>
}