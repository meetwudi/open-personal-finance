import { Button } from "react-bootstrap";
import { ffSyncGoogleSheet } from "../../firebase-functions";

export default function SyncSheetButton(): JSX.Element {
  return <Button onClick={() => ffSyncGoogleSheet()}>Sync to Google Sheet</Button>;
}
