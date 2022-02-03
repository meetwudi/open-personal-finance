import { ffSyncGoogleSheet } from "../../firebase-functions";

export default function SyncSheetButton(): JSX.Element {
  return <button onClick={() => ffSyncGoogleSheet()}>Sync to Google Sheet</button>;
}
