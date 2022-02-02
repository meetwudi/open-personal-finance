import React, { useContext } from "react";
import Callout from "plaid-threads/Callout";
import Button from "plaid-threads/Button";

import Link from "../Link";
import Context from "../../Context";

import styles from "./index.module.scss";

const Header = () => {
  const {
    linkToken,
    linkSuccess,
    backend,
    linkTokenError,
  } = useContext(Context);

  return (
    <div className={styles.grid}>
      {!linkSuccess ? (
        <>
          {/* message if backend is not running and there is no link token */}
          {!backend ? (
            <Callout warning>
              Unable to fetch link_token: please make sure your backend server
              is running and that your .env file has been configured with your
              <code>PLAID_CLIENT_ID</code> and <code>PLAID_SECRET</code>.
            </Callout>
          ) : /* message if backend is running and there is no link token */
            linkToken == null && backend ? (
              <Callout warning>
                <div>
                  Unable to fetch link_token: please make sure your backend server
                  is running and that your .env file has been configured
                  correctly.
                </div>
                <div>
                  Error Code: <code>{linkTokenError.error_code}</code>
                </div>
                <div>
                  Error Type: <code>{linkTokenError.error_type}</code>{" "}
                </div>
                <div>Error Message: {linkTokenError.error_message}</div>
              </Callout>
            ) : linkToken === "" ? (
              <div className={styles.linkButton}>
                <Button large disabled>
                  Loading...
                </Button>
              </div>
            ) : (
              <div className={styles.linkButton}>
                <Link />
              </div>
            )}
        </>
      ) : null}
    </div>
  );
};

Header.displayName = "Header";

export default Header;
