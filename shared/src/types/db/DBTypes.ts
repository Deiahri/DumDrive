export const collectionNames = ['_test_collection', 'user', 'share'] as const;
export type collectionName = (typeof collectionNames)[number];
export type DBObj = {
  id: string
};