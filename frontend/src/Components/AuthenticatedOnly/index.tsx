import { getAuth, User } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

type Props = {
    children: (user: User) => JSX.Element,
    fallback?: JSX.Element,
}

export default function AuthenticatedOnly({children, fallback}: Props): JSX.Element {
  const [user, loadingUser, _errorUser] = useAuthState(getAuth());

  if (loadingUser) {
    return <div></div>;
  }

  if (user == null) {
    return fallback ?? <div>Unauthenticated</div>;
  }

  return children(user);
}
