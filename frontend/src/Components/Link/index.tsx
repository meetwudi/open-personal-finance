import React, { useEffect, useContext } from "react";
import { usePlaidLink } from "react-plaid-link";
import Button from "plaid-threads/Button";

import Context from "../../Context";
import { ffSetAccessToken } from "../../firebase-functions";

const Link = (): JSX.Element => {
  const { linkToken, dispatch } = useContext(Context);

  const onSuccess = React.useCallback(
    (publicToken: string) => {
      // send public_token to server
      const setToken = async () => {
        let data;
        try {
          data = await ffSetAccessToken(publicToken);
        } catch (e) {
          console.error(e);
          dispatch({
            type: "SET_STATE",
            state: {
              itemId: "no item_id retrieved",
              accessToken: "no access_token retrieved",
              isItemAccess: false,
            },
          });
          return;
        }

        dispatch({
          type: "SET_STATE",
          state: {
            itemId: data.item_id,
            accessToken: data.access_token,
            isItemAccess: true,
          },
        });
      };
      setToken();
      dispatch({ type: "SET_STATE", state: { linkSuccess: true } });
      window.history.pushState("", "", "/");
    },
    [dispatch]
  );

  let isOauth = false;
  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken!,
    onSuccess,
  };

  if (window.location.href.includes("?oauth_state_id=")) {
    config.receivedRedirectUri = window.location.href;
    isOauth = true;
  }

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (isOauth && ready) {
      open();
    }
  }, [ready, open, isOauth]);

  return (
    <Button type="button" large onClick={() => open()} disabled={!ready}>
      Connect via Plaid
    </Button>
  );
};

Link.displayName = "Link";

export default Link;
