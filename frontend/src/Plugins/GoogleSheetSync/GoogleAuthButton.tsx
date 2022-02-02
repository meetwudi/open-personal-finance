import { initGoogleAuth } from "../../google-auth";

export default function GoogleAuthButton(): JSX.Element {
  return <button onClick={() => initGoogleAuth()}>Google Auth</button>;
}
