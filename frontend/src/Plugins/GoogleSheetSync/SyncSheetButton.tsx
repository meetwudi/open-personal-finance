import { ffPopulateData } from "../../firebase-functions";

export default function SyncSheetButton(): JSX.Element {
  return <button onClick={() => ffPopulateData()}>Sync to Google Sheet</button>;
}
