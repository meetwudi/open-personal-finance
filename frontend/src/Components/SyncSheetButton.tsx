import { ffPopulateData } from "../firebase-functions";

export default function SyncSheetButton() {
    return <button onClick={() => ffPopulateData()}>Populate Data</button>
}