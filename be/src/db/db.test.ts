import { expect, it, describe, beforeAll, afterAll } from "vitest";
import {
  DBCreate,
  DBGet,
  DBGetWithID,
  DBSet,
  DBSetWithID,
  DBDeleteAllTestDocuments,
} from "./db";
import { DocumentTestKey } from "@shared/types/db/DBData";
import { collectionName } from "@shared/types/db/DBTypes";

type DocType = {
  overriddenField?: string;
  thing: string;
  [DocumentTestKey]: boolean;
  category: string;
  num: number;
};

function isDocTypeArr(docArr: unknown): asserts docArr is DocType[] {
  if (!Array.isArray(docArr)) {
    throw new Error("Not doc type");
  }

  for (const doc of docArr) {
    isDocType(doc);
  }
}

function isDocType(doc: unknown): asserts doc is DocType {
  if (typeof doc !== "object" || doc === null) {
    throw new Error("Document is not of type DocType");
  }
  const { thing, category, num } = doc as DocType;
  const testing = (doc as DocType)[DocumentTestKey];
  if (typeof thing !== "string") {
    console.log(JSON.stringify(doc, null, 2));
    throw new Error("Document is not of type DocType");
  }
  if (typeof testing !== "boolean") {
    console.log(JSON.stringify(doc, null, 2));
    throw new Error("Document is not of type DocType");
  }
  if (typeof category !== "string") {
    console.log(JSON.stringify(doc, null, 2));
    throw new Error("Document is not of type DocType");
  }
  if (typeof num !== "number") {
    console.log(JSON.stringify(doc, null, 2));
    throw new Error("Document is not of type DocType");
  }
}

const DocumentSamples: DocType[] = [
  {
    thing: "mabob",
    [DocumentTestKey]: true,
    category: "alpha",
    num: 0,
  },
  {
    thing: "gadget",
    [DocumentTestKey]: true,
    category: "beta",
    num: 1,
  },
  {
    thing: "widget",
    [DocumentTestKey]: true,
    category: "alpha",
    num: 2,
  },
  {
    thing: "doodad",
    [DocumentTestKey]: true,
    category: "gamma",
    num: 3,
  },
  {
    thing: "contraption",
    [DocumentTestKey]: true,
    category: "beta",
    num: 4,
  },
];

const collection: collectionName = "_test_collection";
let DocumentSampleID = "";

beforeAll(async () => {
  // Clean up any existing test data before running tests
  await DBDeleteAllTestDocuments();
});

describe("DBCreate", () => {
  it("Should create an object successfully and return an ID", async () => {
    const sample = DocumentSamples[0];
    DocumentSampleID = await DBCreate(collection, sample);
    expect(DocumentSampleID).toBeDefined();
  });

  it("Should create additional objects successfully", async () => {
    for (let i = 1; i < DocumentSamples.length; i++) {
      const sample = DocumentSamples[i];
      const id = await DBCreate(collection, sample);
      expect(id).toBeDefined();
    }
  });
});

describe("DBGet", () => {
  it("Should retrieve the created object using a query", async () => {
    const results = await DBGet(collection, [
      ["thing", "==", DocumentSamples[0].thing],
    ]);
    expect(results.length).toBe(1);
    expect(results[0]).toMatchObject(DocumentSamples[0]);
  });

  it("Should retrieve all created objects one by one", async () => {
    for (const sample of DocumentSamples) {
      const results = await DBGet(collection, [["thing", "==", sample.thing]]);
      expect(results.length).toBe(1);
      expect(results[0]).toMatchObject(sample);
    }
  });

  it("Should retrieve objects using AND query combination", async () => {
    const results = await DBGet(
      collection,
      [
        ["thing", "==", DocumentSamples[1].thing],
        [DocumentTestKey, "==", DocumentSamples[1][DocumentTestKey]],
      ],
      "and"
    );
    expect(results.length).toBe(1);
    expect(results[0]).toMatchObject(DocumentSamples[1]);
  });

  it("Should retrieve objects using AND query combination with multiple fields", async () => {
    const results = await DBGet(
      collection,
      [
        ["category", "==", "beta"],
        [DocumentTestKey, "==", true],
      ],
      "and"
    );
    expect(results.length).toBe(2);
    isDocTypeArr(results);
    results;
    expect(
      results.find((doc: DocType) => doc.thing === DocumentSamples[1].thing)
    ).toMatchObject(DocumentSamples[1]);
    expect(
      results.find((doc: DocType) => doc.thing === DocumentSamples[4].thing)
    ).toMatchObject(DocumentSamples[4]);
  });

  it("Should retrieve objects using OR query combination", async () => {
    const results = await DBGet(
      collection,
      [
        ["thing", "==", DocumentSamples[0].thing],
        ["thing", "==", DocumentSamples[2].thing],
      ],
      "or"
    );
    expect(results.length).toBe(2);
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining(DocumentSamples[0]),
        expect.objectContaining(DocumentSamples[2]),
      ])
    );
  });

  it("Should retrieve objects using OR query combination with multiple fields", async () => {
    const results = await DBGet(
      collection,
      [
        ["category", "==", "alpha"],
        ["thing", "==", "doodad"],
      ],
      "or"
    );
    expect(results.length).toBe(3);
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining(DocumentSamples[0]),
        expect.objectContaining(DocumentSamples[2]),
        expect.objectContaining(DocumentSamples[3]),
      ])
    );
  });

  it("Should retrieve a limited number of items", async () => {
    const results = await DBGet(collection, [], undefined, undefined, 1);
    expect(results.length).toBe(1);

    const results2 = await DBGet(collection, [], undefined, undefined, 3);
    expect(results2.length).toBe(3);
  });
});

describe("DBGetWithID", () => {
  it("Should retrieve the created object using its ID", async () => {
    const result = await DBGetWithID(collection, DocumentSampleID);
    expect(result).toMatchObject(DocumentSamples[0]);
  });
});

describe("DBSetWithID", () => {
  it("Should override a document using its ID", async () => {
    const overrideData: DocType = {
      thing: "overridden",
      [DocumentTestKey]: false,
      category: "overridden-category",
      num: 0,
    };

    // Override the first document using its ID
    await DBSetWithID(collection, DocumentSampleID, overrideData);

    const overriddenDoc = await DBGetWithID(collection, DocumentSampleID);
    expect(overriddenDoc).toMatchObject(overrideData);

    // Reflect the changes in the DocumentSamples array
    DocumentSamples[0] = overrideData;
  });

  it("Should override all documents individually using their IDs", async () => {
    const allDocs = await DBGet(collection);
    isDocTypeArr(allDocs);

    for (const docIndex in allDocs) {
      const doc = allDocs[Number(docIndex)];
      const overrideData: DocType = {
        thing: `overridden-${doc.id}`,
        [DocumentTestKey]: false,
        category: "overridden-category",
        num: Number(docIndex),
      };
      await DBSetWithID(collection, doc.id, overrideData);

      const overriddenDoc = await DBGetWithID(collection, doc.id);
      expect(overriddenDoc).toMatchObject(overrideData);

      // Reflect the changes in the DocumentSamples array
      const index = DocumentSamples.findIndex(
        (sample) => sample.thing === doc.thing
      );
      if (index !== -1) {
        DocumentSamples[index] = overrideData;
      }
    }
  });

  it("Should combine fields when updating a document using its ID", async () => {
    const combineData = {
      extraField: "combined-value",
      category: "combined-category",
    };

    // Combine fields in the first document using its ID
    await DBSetWithID(collection, DocumentSampleID, combineData, true);

    const combinedDoc = await DBGetWithID(collection, DocumentSampleID);
    expect(combinedDoc).toMatchObject({
      ...DocumentSamples[0],
      ...combineData,
    });

    // Reflect the changes in the DocumentSamples array
    DocumentSamples[0] = { ...DocumentSamples[0], ...combineData };
  });

  it("Should combine fields for all documents individually using their IDs", async () => {
    const allDocs = await DBGet(collection);
    isDocTypeArr(allDocs);

    for (const doc of allDocs) {
      const combineData = { combinedField: true };
      await DBSetWithID(collection, doc.id, combineData, true);

      const combinedDoc = await DBGetWithID(collection, doc.id);
      expect(combinedDoc).toMatchObject({ ...doc, ...combineData });

      // Reflect the changes in the DocumentSamples array
      const index = DocumentSamples.findIndex(
        (sample) => sample.thing === doc.thing
      );
      if (index !== -1) {
        DocumentSamples[index] = { ...DocumentSamples[index], ...combineData };
      }
    }
  });
});

describe("DBSet", () => {
  it("Should combine fields for all documents", async () => {
    const combineData = { combinedField: "all-docs" };
    await DBSet(collection, combineData, undefined, undefined, true);

    const allDocs = await DBGet(collection);
    isDocTypeArr(allDocs);
    for (const sample of DocumentSamples) {
      const doc = allDocs.find((doc: DocType) => doc.thing === sample.thing);
      expect(doc).toMatchObject({ ...sample, ...combineData });
    }
  });

  it("Should combine fields for a subset of documents", async () => {
    const combineData = { subsetField: "subset-docs" };
    await DBSet(
      collection,
      combineData,
      [["category", "==", "alpha"]],
      undefined,
      true
    );

    const subsetDocs = await DBGet(collection, [["category", "==", "alpha"]]);
    isDocTypeArr(subsetDocs);
    for (const sample of DocumentSamples.filter(
      (sample) => sample.category === "alpha"
    )) {
      const doc = subsetDocs.find((doc: DocType) => doc.thing === sample.thing);
      expect(doc).toMatchObject({ ...sample, ...combineData });
    }
  });

  it("Should override fields for all documents", async () => {
    const overrideData: DocType = {
      overriddenField: "all-override",
      thing: "",
      [DocumentTestKey]: false,
      category: "",
      num: 0,
    };

    // Update DocumentSamples before overriding data
    for (let i = 0; i < DocumentSamples.length; i++) {
      DocumentSamples[i] = { ...overrideData };
    }

    await DBSet(collection, overrideData, undefined, undefined, false);

    const allDocs = await DBGet(collection);
    isDocTypeArr(allDocs);
    for (const sample of DocumentSamples) {
      const doc = allDocs.find((doc: DocType) => doc.thing === sample.thing);
      expect(doc).toMatchObject(overrideData);
    }
  });
});

// TODO: test order
