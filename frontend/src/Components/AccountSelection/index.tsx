import { getAuth, User } from "firebase/auth";
import { collection, getFirestore, query, where } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { COLLECTION_PLAID_FINANCIAL_ACCOUNTS, COLLECTION_USER_ACCOUNT_SETTINGS } from "../../constants";
import { ffUpdatePlaidAccountSettings } from "../../firebase-functions";

type PropsAuthenticated = {
    user: User,
}

function AccountSelectionAuthenticated({ user }: PropsAuthenticated) {
  const [accountSettings, loadingAccountSettings, _errorAccountSettings] = useCollection(
    query(
      collection(getFirestore(), COLLECTION_USER_ACCOUNT_SETTINGS),
      where("uid", "==", user.uid),
    )
  );
  const [accounts, loadingAccounts, _errorAccounts] = useCollection(
    query(
      collection(getFirestore(), COLLECTION_PLAID_FINANCIAL_ACCOUNTS),
      where("uid", "==", user.uid),
    )
  );
  const [enabledAccountIds, setEnabledAccountIds] = useState(new Set());

  useEffect(() => {
    if (loadingAccounts || loadingAccountSettings) {
      return;
    }

    const newEnabledAccountIds = new Set();
    (accounts?.docs ?? []).forEach((account) => {
      const setting = (accountSettings?.docs ?? []).find(
        (setting) => setting.data().accountId === account.data().accountId);

      if (!setting || setting.data().accountEnabledGlobally === true) {
        newEnabledAccountIds.add(account.data().accountId);
      }
    });
    setEnabledAccountIds(newEnabledAccountIds);
  }, [accountSettings, accounts, loadingAccountSettings, loadingAccounts]);

  const onChangeHandler = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, accountId: string) => {
    const newValue = e.target.checked;
    await ffUpdatePlaidAccountSettings(accountId, newValue);
  }, []);

  return <Form>
    {accounts?.docs.map((account) => <div key={account.data().accountId}>
      <Form.Check
        type="checkbox"
        id={account.data().accountId}
        label={account.data().officialName ?? account.data().name}
        checked={enabledAccountIds.has(account.data().accountId)}
        onChange={(e) => onChangeHandler(e, account.data().accountId)}
      ></Form.Check>
    </div>)}
  </Form>;
}

export default function AccountSelection() {
  const [user, _loadingUser, _errorUser] = useAuthState(getAuth());

  if (user == null) {
    return null;
  }

  return <AccountSelectionAuthenticated user={user} />;
}
