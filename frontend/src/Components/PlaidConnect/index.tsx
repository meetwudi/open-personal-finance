import { User } from "firebase/auth";
import usePlaidItems from "../../lib/plaid/usePlaidItems";
import Header from "../Headers";

type Props = {
    children: JSX.Element,
    user: User,
}

export default function PlaidConnect({children, user}: Props): JSX.Element {
  const [items, loadingItems, errorItems] = usePlaidItems(user.uid);

  // FIXME: Error handling
  if (items == null || loadingItems || errorItems) {
    return <div></div>;
  }

  if (items.empty) {
    return <Header />;
  }

  return <>{children}</>;
}
