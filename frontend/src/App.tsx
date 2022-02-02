import React, { useEffect, useContext, useCallback } from "react";

import Header from "./Components/Headers";
import Context from "./Context";

import styles from "./App.module.scss";

// FIXME: Only import what's needed
import "bootstrap/scss/bootstrap.scss";

import { ffCreateLinkToken } from "./firebase-functions";
import AccountSelection from "./Components/AccountSelection";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import GoogleAuthButton from "./Plugins/GoogleSheetSync/GoogleAuthButton";
import GoogleSheetSync from "./Plugins/GoogleSheetSync";
import AuthenticatedOnly from "./Components/AuthenticatedOnly";
import PlaidConnect from "./Components/PlaidConnect";

const App = (): JSX.Element => {
  const { dispatch } = useContext(Context);
  const [user, loadingUser, _errorUser] = useAuthState(getAuth());

  const generateToken = useCallback(
    async () => {
      let data;
      try {
        data = await ffCreateLinkToken();
      } catch (e) {
        console.error(e);
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
    if (user == null) {
      return;
    }

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
  }, [dispatch, generateToken, user]);

  if (loadingUser) {
    return <div>Loading user ...</div>;
  }
  if (!user) {
    return <GoogleAuthButton />;
  }

  return (
    <AuthenticatedOnly>
      {(user) => <PlaidConnect user={user}>
        <div className={styles.App}>
          <div className={styles.container}>
            <div>
              <GoogleAuthButton />
              <Header />
            </div>
            <AccountSelection />

            {/* Plugins */}
            <GoogleSheetSync />
          </div>
        </div>
      </PlaidConnect>}
    </AuthenticatedOnly>
  );
};

export default App;
