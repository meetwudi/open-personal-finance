import { ffPopulateData } from "../../firebase-functions";

export default function PopulateDataButton(): JSX.Element {
  return <button onClick={() => ffPopulateData()}>Refresh Data</button>;
}
