import { GetDirResponse, S3File, S3Folder } from "./S3Types";

export function checkS3File(obj: any): asserts obj is S3File {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error("Object is not valid: Expected a non-null object.");
  }
  const { name, lastModified, size } = obj as S3File;
  if (typeof name !== 'string') {
    throw new Error("Invalid S3File: 'name' must be a string.");
  }
  if (typeof(lastModified) != 'string') {
    throw new Error("Invalid S3File: 'lastModified' must be a Date.");
  }
  if (typeof size !== 'number') {
    throw new Error("Invalid S3File: 'size' must be a number.");
  }
}

export function checkS3Folder(obj: any): asserts obj is S3Folder {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error("Object is not valid: Expected a non-null object.");
  }
  const { name } = obj as S3Folder;
  if (typeof name !== 'string') {
    throw new Error("Invalid S3Folder: 'name' must be a string.");
  }
}

export function checkGetDirResponse(obj: any): asserts obj is GetDirResponse {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error("Object is not valid: Expected a non-null object.");
  }
  const { files, folders, path, nextContinuationToken } = obj as GetDirResponse;
  if (!Array.isArray(files)) {
    throw new Error("Invalid GetDirResponse: 'files' must be an array.");
  }
  files.forEach((file, index) => {
    try {
      checkS3File(file);
    } catch (error) {
      throw new Error(`Invalid GetDirResponse: 'files[${index}]' is not a valid S3File. ${error}`);
    }
  });
  if (!Array.isArray(folders)) {
    throw new Error("Invalid GetDirResponse: 'folders' must be an array.");
  }
  folders.forEach((folder, index) => {
    try {
      checkS3Folder(folder);
    } catch (error) {
      throw new Error(`Invalid GetDirResponse: 'folders[${index}]' is not a valid S3Folder. ${error}`);
    }
  });
  if (typeof path !== 'string') {
    throw new Error("Invalid GetDirResponse: 'path' must be a string.");
  }
  if (nextContinuationToken !== undefined && typeof nextContinuationToken !== 'string') {
    throw new Error("Invalid GetDirResponse: 'nextContinuationToken' must be a string or undefined.");
  }
}