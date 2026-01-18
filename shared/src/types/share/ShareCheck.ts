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

  if (file !== null && typeof file !== 'string') {
    throw new Error('file must be a string if defined');
  }

  if (typeof users !== 'object' || users === null) {
    throw new Error('users must be an object');
  }

  if (!Array.isArray(users)) {
    throw new Error('users must be an array of strings');
  }

  for (const user of users) {
    if (typeof user !== 'string') {
      throw new Error('users must be an array of strings');
    }
  }
}