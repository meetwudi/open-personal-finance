import { User } from "firebase/auth";
import { addDoc, collection, getFirestore, QueryDocumentSnapshot, updateDoc } from "firebase/firestore";
import { first } from "lodash";
import { useCallback, useState } from "react";
import { Form, Button } from "react-bootstrap";
import { COLLECTION_APP_GSS_SETTINGS } from "./collections";
import useSettings from "./useSettings";

type InnerProps = {user: User, settings: QueryDocumentSnapshot};

function SettingsInner({ user, settings }: InnerProps): JSX.Element | null {
  const [localSettings, setLocalSettings] = useState(
    Object.assign({}, {
      isEnabled: false,
      uid: user.uid,
      spreadsheetUrl: "",
      sheetName: "Sheet1"
    }, settings.data() ?? {}),
  );

  console.log(localSettings);
  const commitUpdate = useCallback(async () => {
    if (settings.exists()) {
      await updateDoc(settings.ref, localSettings);
    } else {
      await addDoc(
        collection(getFirestore(), COLLECTION_APP_GSS_SETTINGS),
        localSettings,
      );
    }
  }, [localSettings, settings]);

  const onChangeIsEnabledHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const {checked: isEnabled} = e.target;
      setLocalSettings((s) => ({ ...s, isEnabled }));
    }, []);

  const onChangeSpreadsheetUrlHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const {value: spreadsheetUrl} = e.target;
      setLocalSettings((s) => ({ ...s, spreadsheetUrl }));
    }, []);

  const onChangeSheetNameHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const {value: sheetName} = e.target;
      setLocalSettings((s) => ({ ...s, sheetName }));
    }, []);

  return <Form>
    <Form.Check
      type="checkbox"
      id="isEnabled"
      label="Enabled"
      checked={localSettings.isEnabled === true}
      onChange={onChangeIsEnabledHandler}
    ></Form.Check>
    <div>
      <Form.Label htmlFor="spreadsheetUrl">Spreadsheet URL</Form.Label>
      <Form.Control
        type="text"
        id="spreadsheetUrl"
        aria-describedby="spreadsheetUrlDesc"
        onChange={onChangeSpreadsheetUrlHandler}
        value={localSettings.spreadsheetUrl}
      />
      <Form.Text id="spreadsheetUrlDesc" muted>Enter the URL of the spreadsheet.</Form.Text>
    </div>
    <div>
      <Form.Label htmlFor="sheetName">Sheet Name</Form.Label>
      <Form.Control
        type="text"
        id="sheetName"
        aria-describedby="sheetNameDesc"
        onChange={onChangeSheetNameHandler}
        value={localSettings.sheetName}
      />
      <Form.Text id="sheetNameDesc" muted>Name of the sheet that you would like to use.</Form.Text>
    </div>
    <Button onClick={commitUpdate}>Save Settings</Button>
  </Form>;
}

type Props = {user: User};

export default function Settings(props: Props): JSX.Element | null {
  const [settings, loadingSettings, _errorSettings] = useSettings(props.user);
  const settingsDoc = first(settings?.docs);

  if (settingsDoc == null || loadingSettings) {
    return null;
  }

  return <SettingsInner {...props} settings={settingsDoc} />;
}
