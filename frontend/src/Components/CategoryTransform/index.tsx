import { User } from "firebase/auth";
import { addDoc, collection, doc, DocumentReference, getDoc, getFirestore, query, QueryDocumentSnapshot, updateDoc, where } from "firebase/firestore";
import { first } from "lodash";
import { useCallback, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useCollection } from "react-firebase-hooks/firestore";

type Props = {
    user: User,
}

export default function CategoryTransform(props: Props): JSX.Element | null {
  const [configSnap, loadingConfig, _errorConfig] = useCollection(
    query(
      collection(getFirestore(), "cat_transform_configs"),
      where("uid", "==", props.user.uid),
    )
  );

  if (loadingConfig || _errorConfig) {
    return null;
  }

  const config = first(configSnap?.docs);
  return <Editor configSnap={config} user={props.user} />;
}

type EditorProps = {
  configSnap: QueryDocumentSnapshot | null | undefined,
  user: User,
}

function Editor(props: EditorProps): JSX.Element {
  const localConfig = Object.assign(
    {},
    { uid: props.user.uid, rules: [] as any[] },
    props.configSnap?.data() ?? {},
  );

  const [newRuleMatcherType, setNewRuleMatcherType] = useState("transactionNameContains");
  const [newRuleMatcherValue, setNewRuleMatcherValue] = useState("");
  const [newRuleAddCategories, setNewRuleAddCategories] = useState("");
  const [newRuleRemoveCategories, setNewRuleRemoveCategories] = useState("");

  const handleAddRule = useCallback(async () => {
    const newRule = {
      // The id just needs to be unique within the config so this is enough.
      id: Math.random().toString().slice(2),
      matcher: {
        type: newRuleMatcherType,
        value: newRuleMatcherValue,
      },
      addCategories: newRuleAddCategories.split(",").filter((v) => v !== ""),
      removeCategories: newRuleRemoveCategories.split(",").filter((v) => v !== ""),
    };

    const newConfig = {
      ...localConfig,
      rules: [
        ...localConfig.rules,
        newRule,
      ]
    };

    if (props.configSnap != null) {
      await updateDoc(props.configSnap.ref, newConfig);
    } else {
      await addDoc(collection(getFirestore(), "cat_transform_configs"), newConfig);
    }
  }, [localConfig, newRuleAddCategories, newRuleMatcherType, newRuleMatcherValue, newRuleRemoveCategories, props.configSnap]);

  const handleDelete = useCallback(async (ruleId: string) => {
    if (props.configSnap == null) {
      return;
    }

    const newConfig = {
      ...localConfig,
      rules: [
        ...localConfig.rules.filter((rule) => rule.id !== ruleId),
      ]
    };

    await updateDoc(props.configSnap.ref, newConfig);
  }, [localConfig, props.configSnap]);

  return <div>
    <ul>
      {localConfig.rules.map((rule) => <ul key={rule.id}>
        <li>Matcher Type: {rule.matcher.type}</li>
        <li>Matcher Value: {rule.matcher.value}</li>
        <li>Add categories: {rule.addCategories.join(",")}</li>
        <li>Remove categories: {rule.removeCategories.join(",")}</li>
        <li><a href="#" onClick={() => handleDelete(rule.id)}>Delete</a></li>
      </ul>)}
    </ul>
    <Form>
      <Form.Group className="mb-3" controlId="newRuleMatcherType">
        <Form.Label>Condition</Form.Label>
        <Form.Select value={newRuleMatcherType} onChange={(e) => setNewRuleMatcherType(e.target.value)} aria-label="Default select">
          <option value="transactionNameContains">When transaction name contains value</option>
          <option value="merchantNameContains">When merchant name contains value</option>
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3" controlId="newRuleMatcherValue">
        <Form.Label>Value</Form.Label>
        <Form.Control type="text" value={newRuleMatcherValue} onChange={(e) => setNewRuleMatcherValue(e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="newRuleAddCategories">
        <Form.Label>Add Categories (separate by comma)</Form.Label>
        <Form.Control type="text" value={newRuleAddCategories} onChange={(e) => setNewRuleAddCategories(e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="newRuleRemoveCategories">
        <Form.Label>Remove Categories (separate by comma)</Form.Label>
        <Form.Control type="text" value={newRuleRemoveCategories} onChange={(e) => setNewRuleRemoveCategories(e.target.value)} />
      </Form.Group>
      <Button onClick={handleAddRule}>Add Rule</Button>
    </Form>
  </div>;
}

