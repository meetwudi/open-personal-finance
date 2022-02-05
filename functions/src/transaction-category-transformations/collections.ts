
/**

You can assume the typing of this collection to be as followings.

export type CategoryTransformConfig = {
    uid: string,
    rules: [
        {
            id: string,
            matcher: CategoryTransformMatcher,
            addCategories: [string],
            removeCategories: [string],
        }
    ],
};

type CategoryTransformMatcher = {
    type: "transactionNameContains",
    value: string,
} | {
    type: "merchantNameContains",
    value: string,
}

*/

export const COLLECTION_CAT_TRANSFORM_CONFIGS = "cat_transform_configs";
