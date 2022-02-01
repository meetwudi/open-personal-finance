import React, { useEffect, useContext, useCallback } from "react";

import Header from "./Components/Headers";
import Context from "./Context";

import styles from "./App.module.scss";
import { ffCreateLinkToken } from "./firebase-functions";
import GoogleAsyncMultiStep from "./Plugins/GoogleSyncMultiStep";
import AccountSelection from "./Components/AccountSelection";

const App = () => {
  const { dispatch } = useContext(Context);

  const generateToken = useCallback(
    async () => {
      let data;
      try {
        data = await ffCreateLinkToken();
      } catch (e) {
        dispatch({ type: "SET_STATE", state: { linkToken: null } });
        return;
      }

      if (data) {
        if (data.error != null) {
          dispatch({
            type: "SET_STATE",
            state: {
              linkToken: null,
              linkTokenError: data.error,
            },
          });
          return;
        }
        dispatch({ type: "SET_STATE", state: { linkToken: data.link_token } });
      }
      localStorage.setItem("link_token", data.link_token); // to use later for Oauth
    },
    [dispatch]
  );

  useEffect(() => {
    const init = async () => {
      // do not generate a new token for OAuth redirect; instead
      // setLinkToken from localStorage
      if (window.location.href.includes("?oauth_state_id=")) {
        dispatch({
          type: "SET_STATE",
          state: {
            linkToken: localStorage.getItem("link_token"),
          },
        });
        return;
      }
      generateToken();
    };
    init();
  }, [dispatch, generateToken]);

  return (
    <div className={styles.App}>
      <div className={styles.container}>
        <div>
          <Header />
        </div>
        <AccountSelection />

        {/* Plugins */}
        <GoogleAsyncMultiStep />
      </div>
    </div>
  );
};

export default App;
