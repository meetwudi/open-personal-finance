import { getAuth, User } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

type Props = {
    children: (user: User) => JSX.Element,
}

export default function AuthenticatedOnly({children}: Props): JSX.Element {
  const [user, loadingUser, _errorUser] = useAuthState(getAuth());

  if (loadingUser) {
    return <div></div>;
  }

  if (user == null) {
    return <div>Unauthorized</div>;
  }

  return children(user);
}
