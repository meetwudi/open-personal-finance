import { Link, Outlet } from "react-router-dom";
import cx from "classnames";

import styles from "./index.module.scss";
import GoogleAuthButton from "../../apps/GoogleSheetSync/GoogleAuthButton";
import PopulateDataButton from "./PopulateDataButton";

export default function PageLayout(): JSX.Element {
  return <div className={cx("d-flex flex-row align-items-stretch", styles.pageContainer)}>
    <div className={cx("d-flex flex-column flex-shrink-0 p-3 text-white bg-dark", styles.sidebarContainer)}>
      <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
        <span className="fs-2"><strong>OpenPF</strong></span>
      </a>
      <ul className="nav nav-pills flex-column mb-auto mt-4">
        <li className="mb-2">
          <Link className="nav-link" to="/">Home</Link>
        </li>
        <li className="mb-2">
          <Link className="nav-link" to="/apps/google_sheet_sync">Google Sheet Sync</Link>
        </li>
        <li className="mb-2">
          <GoogleAuthButton />
          <PopulateDataButton />
        </li>
      </ul>
    </div>
    <Outlet />
  </div>;
}
