import { ffSyncSheet } from "../firebase-functions";

export default function SyncSheetButton() {
    return <button onClick={() => ffSyncSheet()}>Sync Sheet</button>
}