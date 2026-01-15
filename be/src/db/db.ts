import '../scripts/firebase'; // sets up firebase
import admin from "firebase-admin";
import { DocumentTestKey } from "@shared/types/db/DBData";
import {
  collectionName,
  collectionNames,
  DBObj,
} from "@shared/types/db/DBTypes";
import { getFirestore } from "firebase-admin/firestore";
import { sleep } from '../scripts/tools';

const db = getFirestore();

type comparisonOperator =
  | "<"
  | ">"
  | "<="
  | ">="
  | "=="
  | "!="
  | "array-contains";
type queryTuple = [
  string,
  comparisonOperator,
  string | null | number | boolean
];
type queryStyle = "or" | "and";
type orderDirection = "asc" | "desc";

// field and direction to order field.
type orderTuple = [string, orderDirection];

export async function DBGetWithID(
  collectionName: collectionName,
  id: string
): Promise<DBObj | undefined> {
  if (!id) {
    throw new Error("DBGetWithID called with empty id");
  }
  try {
    // fetch from db
    const res = (await db.collection(collectionName).doc(id).get()).data();
    if (!res) {
      // if no db hit, then mark in cache that this item does not exist.
      return undefined;
    }
    const resComb = { ...res, id };
    return { ...resComb };
  } catch (error) {
    console.error(`Error in DBGetWithID(${collectionName}, ${id}): ${error}`);
    return undefined;
  }
}

export async function DBGet(
  collectionName: collectionName,
  queries?: queryTuple[],
  queryStyle?: queryStyle,
  order?: orderTuple,
  limit?: number
): Promise<DBObj[]> {
  try {
    let queryRef: FirebaseFirestore.Query = db.collection(collectionName);

    // --- Apply filters ---
    if (queries && queries.length > 0) {
      const filters = queries.map(([field, op, val]) =>
        admin.firestore.Filter.where(field, op, val)
      );

      if (queryStyle === "or") {
        // Requires firebase-admin >= v11.9
        queryRef = queryRef.where(admin.firestore.Filter.or(...filters));
      } else {
        // AND logic = chain .where()
        for (const [field, op, val] of queries) {
          queryRef = queryRef.where(field, op, val);
        }
      }
    }

    // --- Apply ordering ---
    if (order) {
      const [field, direction] = order;
      queryRef = queryRef.orderBy(field, direction);
    }

    // --- Execute query ---
    const res = await queryRef.limit(limit ? limit : 100).get();

    if (res.empty) return [];

    const results: DBObj[] = [];

    res.forEach((doc) => {
      const val = { ...doc.data(), id: doc.id };
      results.push(val);
    });

    return results;
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function DBSet(
  collectionName: collectionName,
  value: object,
  queries?: queryTuple[],
  queryStyle?: queryStyle,
  combine: boolean = false
) {
  const res = await DBGet(collectionName, queries, queryStyle);
  res.forEach(async (obj) => {
    let newObj: object;
    if (combine) {
      newObj = { ...obj, ...value };
    } else {
      newObj = value;
    }
    await db.collection(collectionName).doc(obj.id).set(newObj);
  });

  // intentional sleep, so a following get request will get up to date information.
  // firestore does not guarentee consistency for these kinds of updates.
  await sleep(150);
}

export async function DBSetWithID(
  collectionName: collectionName,
  id: string,
  value: object,
  combine: boolean = false
) {
  let newObj: object;
  if (combine) {
    const obj = await DBGetWithID(collectionName, id); // needed to update cache. If item is in cache already, this fetches it from there.
    newObj = { ...obj, ...value };
  } else {
    newObj = value;
  }
  await db.collection(collectionName).doc(id).set(newObj);
}

/**
 * Create a new document with an auto-generated ID
 */
export async function DBCreate(collectionName: collectionName, value: object) {
  const docRef = await db.collection(collectionName).add(value); // add() auto-generates ID
  const resID = docRef.id;

  return resID;
}

/**
 * Create or overwrite a document with a specific ID
 */
export async function DBCreateWithID(
  collectionName: collectionName,
  value: object,
  id: string
) {
  await db.collection(collectionName).doc(id).set(value);
}

export async function DBDelete(
  collectionName: collectionName,
  queries?: queryTuple[],
  queryStyle?: "and" | "or"
) {
  // Get documents matching the query
  const docs = await DBGet(collectionName, queries, queryStyle);

  // Delete all documents in parallel
  await Promise.all(
    docs.map(async (obj) => {
      await db.collection(collectionName).doc(obj.id).delete();
    })
  );
}

export async function DBDeleteWithID(
  collectionName: collectionName,
  id: string
) {
  await db.collection(collectionName).doc(id).delete();
}

export async function DBDeleteAllTestDocuments() {
  await Promise.all(
    collectionNames.map(async (collectionName: collectionName) => {
      await DBDelete(collectionName, [[DocumentTestKey, "!=", ""]]);
    })
  );
}
