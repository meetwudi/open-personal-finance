import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "../../App";
import OfflineGoogleAuthHandler from "../GoogleAuth/OfflineGoogleAuthHandler";

export default function AppRouter(): JSX.Element {
  return <BrowserRouter>
    <Routes>
      <Route path="/google_auth_handler" element={<OfflineGoogleAuthHandler />}/>
      <Route path="/" element={<App />} />
    </Routes>
  </BrowserRouter>;
}
