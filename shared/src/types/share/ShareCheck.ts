import { Share } from "./ShareType";

export function checkShare(obj: any): asserts obj is Share {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('Object is not of type Share');
  }

  const { bucketName, path, file, users } = obj as Share;

  if (typeof bucketName !== 'string') {
    throw new Error('bucketName must be a string');
  }

  if (typeof path !== 'string') {
    throw new Error('path must be a string');
  }

  if (file !== undefined && typeof file !== 'string') {
    throw new Error('file must be a string if defined');
  }

  if (typeof users !== 'object' || users === null) {
    throw new Error('users must be an object');
  }

  for (const [userID, value] of Object.entries(users)) {
    if (typeof userID !== 'string' || typeof value !== 'boolean') {
      throw new Error('users must be an object with string keys and boolean values');
    }
  }
}