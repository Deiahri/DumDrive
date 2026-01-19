import { DocumentTestKey } from "../db/DBData";

export interface UserObj {
  subID: string,
  email: string,
  username: string,
  [DocumentTestKey]?: boolean,
  id?: string
};