import { User } from "firebase/auth";
import { addDoc, collection, getFirestore, updateDoc } from "firebase/firestore";
import { first } from "lodash";
import { useCallback, useMemo } from "react";
import { Form } from "react-bootstrap";
import { COLLECTION_APP_GSS_SETTINGS } from "./collections";
import { Column, getColumnName } from "./columns";
import useSettings from "./useSettings";

type Props = {user: User};

export default function Settings(props: Props): JSX.Element | null {
  const [settings, loadingSettings, _errorSettings] = useSettings(props.user);
  const settingsDoc = first(settings?.docs);
  const enabledColumns = useMemo(() => new Set(
    settingsDoc?.data().enabledColumns ?? []), [settingsDoc]);
  const onChangeHandler = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, col: Column) => {
      const newEnabledColumn = new Set(enabledColumns);
      if (e.target.checked) {
        newEnabledColumn.add(col);
      } else {
        newEnabledColumn.delete(col);
      }

      const update = {
        enabledColumns: Array.from(newEnabledColumn),
      };
      if (settingsDoc != null) {
        await updateDoc(settingsDoc.ref, update);
      } else {
        await addDoc(
          collection(getFirestore(), COLLECTION_APP_GSS_SETTINGS),
          Object.assign({}, update, {
            uid: props.user.uid
          }),
        );
      }
    }, [enabledColumns, props.user.uid, settingsDoc]);

  if (loadingSettings) {
    return null;
  }

  return <Form>
    {Object.values(Column).map((col) => <div key={col}>
      <Form.Check
        type="checkbox"
        id={col}
        label={getColumnName(col)}
        checked={enabledColumns.has(col)}
        onChange={(e) => onChangeHandler(e, col)}
      ></Form.Check>
    </div>)}
  </Form>;
}
