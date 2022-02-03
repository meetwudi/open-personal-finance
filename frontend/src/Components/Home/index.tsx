import React, { useEffect, useContext, useCallback } from "react";

import styles from "./index.module.scss";

import Context from "../../Context";
import { getAuth, User } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { ffCreateLinkToken } from "../../firebase-functions";
import AuthenticatedOnly from "../AuthenticatedOnly";
import PlaidConnect from "../PlaidConnect";
import AccountSelection from "../AccountSelection";
import GoogleSheetSync from "../../apps/GoogleSheetSync";

const Home = (): JSX.Element => {
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

  return (
    <AuthenticatedOnly fallback={<div>Not signed in</div>}>
      {(user: User) =>
        <PlaidConnect user={user}>
          <div className={styles.App}>
            <div className={styles.container}>
              <AccountSelection />
            </div>
          </div>
        </PlaidConnect>}
    </AuthenticatedOnly>
  );
};

export default Home;
