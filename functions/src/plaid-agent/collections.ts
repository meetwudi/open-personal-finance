/**
 * Items synced from plaid.
 */
export const COLLECTION_PLAID_ITEM = "plaid_items";

/**
 * Accounts synced from plaid.
 */
export const COLLECTION_PLAID_FINANCIAL_ACCOUNTS = "plaid_financial_accounts";

/**
 * Transactions synced from plaid. These transactions are not filtered or deduplicated,
 * but additional fields might be added like `markedAsDuplicatedByUser`.
 */
export const COLLECTION_PLAID_TRANSACTIONS = "plaid_raw_transactions";
