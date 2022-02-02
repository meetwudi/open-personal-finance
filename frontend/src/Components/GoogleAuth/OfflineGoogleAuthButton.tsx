import { useCallback } from "react";
import { ffGetGoogleOfflineAuthLink } from "../../firebase-functions";

export default function OfflineGoogleAuthButton(): JSX.Element {
  const handleClick = useCallback(async () => {
    const link = await ffGetGoogleOfflineAuthLink();
    window.location = link;
  }, []);

  return <button onClick={handleClick}>
      Request permissions
  </button>;
}
