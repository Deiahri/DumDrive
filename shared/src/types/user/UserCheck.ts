import { DocumentTestKey } from "../db/DBData";
import { UserObj } from "./UserType";

export function checkUserObj(obj: unknown): asserts obj is UserObj {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("Object is not of type UserObj");
  }

  const { subID, email, username, [DocumentTestKey]: testVal } = obj as UserObj;

  if (typeof subID !== "string") {
    throw new Error("subID must be a string: "+subID);
  }

  if (typeof email !== "string") {
    throw new Error("email must be a string");
  }

  if (typeof username !== "string") {
    throw new Error("username must be a string");
  }

  if (testVal !== undefined && typeof testVal !== "boolean") {
    throw new Error("DocumentTestKey must be a boolean if defined");
  }
}
