import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "../../App";
import OfflineGoogleAuthHandler from "../GoogleAuth/OfflineGoogleAuthHandler";
import PageLayout from "../PageLayout";

export default function AppRouter(): JSX.Element {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<PageLayout />}>
        <Route path="/google_auth_handler" element={<OfflineGoogleAuthHandler />}/>
        <Route index element={<App />} />
      </Route>
    </Routes>
  </BrowserRouter>;
}
