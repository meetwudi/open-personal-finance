import { BrowserRouter, Route, Routes } from "react-router-dom";
import GoogleSheetSync from "../../apps/GoogleSheetSync";
import OfflineGoogleAuthHandler from "../GoogleAuth/OfflineGoogleAuthHandler";
import Home from "../Home";
import PageLayout from "../PageLayout";

import "./global.scss";

export default function AppRouter(): JSX.Element {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<PageLayout />}>
        <Route path="/apps">
          <Route path="/apps/google_sheet_sync" element={<GoogleSheetSync />} />
        </Route>
        <Route path="/google_auth_handler" element={<OfflineGoogleAuthHandler />}/>
        <Route index element={<Home />} />
      </Route>
    </Routes>
  </BrowserRouter>;
}
