import { getAuth, User } from "firebase/auth";
import { QueryDocumentSnapshot, updateDoc } from "firebase/firestore";
import React, { useCallback} from "react";
import { Form } from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import usePlaidAccounts from "../../lib/plaid/usePlaidAccounts";

type PropsAuthenticated = {
    user: User,
}

function AccountSelectionAuthenticated({ user }: PropsAuthenticated) {
  const [accounts, _loadingAccounts, _errorAccounts] = usePlaidAccounts(user.uid);

  const onChangeHandler = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>,
      account: QueryDocumentSnapshot
    ) => {
      await updateDoc(
        account.ref,
        {
          accountEnabledGlobally: e.target.checked,
        }
      );
    }, []);

  return <Form>
    {accounts?.docs.map((account) => <div key={account.data().accountId}>
      <Form.Check
        type="checkbox"
        id={account.data().accountId}
        label={account.data().officialName ?? account.data().name}
        checked={account.data().accountEnabledGlobally !== false}
        onChange={(e) => onChangeHandler(e, account)}
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
