import { useCallback } from "react";
import { ffGetGoogleOfflineAuthLink } from "../../firebase-functions";

export default function OfflineGoogleAuthButton(): JSX.Element {
  const handleClick = useCallback(async () => {
    const link = await ffGetGoogleOfflineAuthLink();
    window.open(link, "_blank", "popup");
  }, []);

  return <button onClick={handleClick}>
      Request permissions
  </button>;
}
