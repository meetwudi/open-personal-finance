import AuthenticatedOnly from "../AuthenticatedOnly";
import { initGoogleAuth } from "../../google-auth";

export default function GoogleAuthButton(): JSX.Element {
  // FIXME: Ugly hack.
  return <AuthenticatedOnly
    fallback={<button onClick={() => initGoogleAuth()}>Sign in with Google</button>}>
    {() => <></>}
  </AuthenticatedOnly>;
}
