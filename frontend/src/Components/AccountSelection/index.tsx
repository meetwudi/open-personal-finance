import { getAuth, User } from "firebase/auth";
import React, { useCallback} from "react";
import { Form } from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import { ffUpdatePlaidAccountSettings } from "../../firebase-functions";
import usePlaidAccounts from "../../lib/plaid/usePlaidAccounts";

type PropsAuthenticated = {
    user: User,
}

function AccountSelectionAuthenticated({ user }: PropsAuthenticated) {
  const [accounts, _loadingAccounts, _errorAccounts] = usePlaidAccounts(user.uid);

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
        checked={account.data().accountEnabledGlobally !== false}
        onChange={(e) => onChangeHandler(e, account.data().accountId)}
      ></Form.Check>
    </div>)}
  </Form>;
}

export default function AccountSelection(): JSX.Element | null {
  const [user, _loadingUser, _errorUser] = useAuthState(getAuth());

  if (user == null) {
    return null;
  }

  return <AccountSelectionAuthenticated user={user} />;
}
