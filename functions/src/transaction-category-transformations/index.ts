import * as admin from "firebase-admin";
import { first } from "lodash";
import { Transaction } from "plaid";
import { COLLECTION_CAT_TRANSFORM_CONFIGS } from "./collections";

function mutateCategories(
  categories: Set<string>,
  addCategories: string[],
  removeCategories: string[],
): void {
  addCategories.forEach((addCategory) => categories.add(addCategory));
  removeCategories.forEach((removeCategory) => categories.delete(removeCategory));
}

export async function transformCategories(uid: string, transaction: Transaction): Promise<void> {
  // FIXME: Will this get called for every transaction? Figure out how caching works and
  //        perhaps we want to memorize the configs doc.
  const configsSnap = await admin.firestore().collection(COLLECTION_CAT_TRANSFORM_CONFIGS)
    .where("uid", "==", uid)
    .get();

  const config = first(configsSnap.docs);
  if (!config) {
    return;
  }

  const rules = config.data().rules;
  const categories = new Set(transaction.category ?? []);

  rules.forEach((rule: any) => {
    switch (rule.matcher.type) {
    case "transactionNameContains":
      if (transaction.name.includes(rule.matcher.value)) {
        mutateCategories(
          categories,
          rule.addCategories,
          rule.removeCategories,
        );
      }
      break;
    case "merchantNameContains":
      if (transaction.merchant_name?.includes(rule.matcher.value) === true) {
        mutateCategories(
          categories,
          rule.addCategories,
          rule.removeCategories,
        );
      }
      break;
    default:
      break;
    }
  });

  transaction.category = Array.from(categories);
}
