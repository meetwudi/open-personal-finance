import { uniqBy } from "lodash";
import { Transaction } from "plaid";

export default function dedupTransactions(txns: Transaction[]): Transaction[] {
  return uniqBy(
    txns,
    (txn) => `${txn.account_id}:${txn.amount}:${txn.authorized_date}:${txn.authorized_datetime}:${txn.merchant_name}:${txn.name}`,
  );
}
