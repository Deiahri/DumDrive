import {
  // ForbiddenS3BucketPrefixes,
  GetDirResponse,
  S3File,
  S3Folder,
} from "./S3Types";

export function checkS3File(obj: any): asserts obj is S3File {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("Object is not valid: Expected a non-null object.");
  }
  const { name, lastModified, size, isLoading } = obj as S3File;
  if (typeof name !== "string") {
    throw new Error("Invalid S3File: 'name' must be a string.");
  }
  if (typeof lastModified !== "string") {
    throw new Error("Invalid S3File: 'lastModified' must be a string.");
  }
  if (typeof size !== "number") {
    throw new Error("Invalid S3File: 'size' must be a number.");
  }
  if (isLoading !== undefined && typeof isLoading !== "boolean") {
    throw new Error("Invalid S3File: 'isLoading' must be a boolean.");
  }
}

export function checkS3Folder(obj: any): asserts obj is S3Folder {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("Object is not valid: Expected a non-null object.");
  }
  const { name, isLoading } = obj as S3Folder;
  if (typeof name !== "string") {
    throw new Error("Invalid S3Folder: 'name' must be a string.");
  }
  if (isLoading !== undefined && typeof isLoading !== "boolean") {
    throw new Error("Invalid S3Folder: 'isLoading' must be a boolean.");
  }
}

export function checkGetDirResponse(obj: any): asserts obj is GetDirResponse {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("Object is not valid: Expected a non-null object.");
  }
  const { files, folders, path, nextContinuationToken, success } =
    obj as GetDirResponse;
  if (!Array.isArray(files)) {
    throw new Error("Invalid GetDirResponse: 'files' must be an array.");
  }
  files.forEach((file, index) => {
    try {
      checkS3File(file);
    } catch (error) {
      throw new Error(
        `Invalid GetDirResponse: 'files[${index}]' is not a valid S3File. ${error}`,
      );
    }
  });
  if (!Array.isArray(folders)) {
    throw new Error("Invalid GetDirResponse: 'folders' must be an array.");
  }
  folders.forEach((folder, index) => {
    try {
      checkS3Folder(folder);
    } catch (error) {
      throw new Error(
        `Invalid GetDirResponse: 'folders[${index}]' is not a valid S3Folder. ${error}`,
      );
    }
  });
  if (typeof path !== "string") {
    throw new Error("Invalid GetDirResponse: 'path' must be a string.");
  }
  if (
    nextContinuationToken !== undefined &&
    typeof nextContinuationToken !== "string"
  ) {
    throw new Error(
      "Invalid GetDirResponse: 'nextContinuationToken' must be a string.",
    );
  }
  if (typeof success !== "boolean") {
    throw new Error("Invalid GetDirResponse: 'success' must be a boolean.");
  }
}

/**
 * Validates an S3 bucket name to ensure it adheres to specific naming rules.
 *
 * @param obj - The bucket name to validate.
 *
 * @returns `true` if the bucket name is valid.
 *
 * @throws An error if the bucket name is invalid. The error message specifies the reason:
 * - "Invalid bucket name: must be a string." if the input is not a string.
 * - "Invalid bucket name: contains illegal characters." if the bucket name contains characters other than lowercase letters (a-z, excluding i, o, and u) or digits (0-9).
 *
 * @remarks
 * - The function uses a regular expression (`/^[0-9a-hj-np-tv-z]+$/`) to validate the bucket name.
 * - This function enforces a stricter subset of S3 bucket naming rules to comply with Crockford Base32 requirements.
 */
export function checkBucketName(obj: string): boolean {
  const bucketNameRegex = /^[0-9a-hj-np-tv-z]+$/;
  if (typeof obj !== "string") {
    throw new Error("Invalid bucket name: must be a string.");
  }
  if (!bucketNameRegex.test(obj)) {
    console.log('awdji', obj);
    throw new Error("Invalid bucket name: contains illegal characters.");
  }
  return true;
}
