import { DocumentTestKey } from "../db/DBData";

export interface Share {
	bucketName: string,
	path: string,
	file?: string,
	users: string[],
	[DocumentTestKey]?: boolean
};