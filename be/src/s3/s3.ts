import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
  PutBucketCorsCommand,
  DeleteObjectsCommand,
  DeleteBucketCommand,
  HeadBucketCommand,
  GetBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetDirResponse } from "@shared/types/s3/S3Types";
import { ConvertToBase32, ExtractFromBase32, sleep } from "../scripts/tools";
import { env_vars } from "../scripts/env_vars";
import { checkBucketName } from "@shared/types/s3/S3Check";
import { GetDirFilesPerRequest } from "@shared/types/s3/s3Data";
import {
  DBCreate,
  DBDeleteWithID,
  DBGet,
  DBSetWithID,
  queryTuple,
} from "../db/db";
import { Share } from "@shared/types/share/ShareType";
import { checkShare } from "@shared/types/share/ShareCheck";
import { DBObj } from "@shared/types/db/DBTypes";

const s3 = new S3Client({
  // region: "us-east-2",
});

export const genSignedUploadURL = async ({
  bucket,
  key,
  contentType,
}: {
  bucket: string;
  key: string;
  contentType: string;
}) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: 900,
  });

  return url;
};

export const genSignedDownloadURL = async ({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}) => {
  const getCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(s3, getCommand, {
    expiresIn: 180,
  });

  // console.log("dl", url);

  return url;
};

export const deleteFile = async ({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}) => {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  } catch {
    return false;
  }
  return true;
};

export const deleteDir = async ({
  bucket,
  path,
}: {
  bucket: string;
  path: string;
}) => {
  // removes delimiter to get every item in path (even in sub-paths)
  try {
    const dirRes = await getDir({
      bucket,
      path,
      forceDelimiter: "",
    });
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: dirRes.files.map((file) => {
            return {
              Key: file.name,
            };
          }),
        },
      }),
    );
  } catch {
    return false;
  }
  return true;
};

export const createFolder = async ({
  bucket,
  path,
  folderName,
}: {
  bucket: string;
  path: string;
  folderName: string;
}) => {
  // adds / to end of path and folderName to make api more forgiving

  if (path && path.charAt(path.length - 1) != "/") {
    path += "/";
  }

  if (folderName.charAt(folderName.length - 1) != "/") {
    folderName += "/";
  }

  const totalPath = (path || "") + folderName;

  // console.log('createdFolder', path, folderName)
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: totalPath,
      Body: "",
    }),
  );
};

export const createFile = async ({
  bucket,
  path,
  fileName,
  body,
}: {
  bucket: string;
  path: string;
  fileName: string;
  body: string;
}) => {
  // adds / to end of path to make API more forgiving
  if (path && path.length != 0 && path.charAt(path.length - 1) !== "/") {
    path += "/";
  }

  const totalPath = path + fileName;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: totalPath,
      Body: body,
    }),
  );
};

export const getDir = async ({
  bucket,
  path,
  continuationToken,
  forceDelimiter,
}: {
  bucket: string;
  path: string;
  continuationToken?: string;
  forceDelimiter?: string;
}) => {
  const resObj: GetDirResponse = {
    files: [],
    folders: [],
    path: path,
    success: false,
  };

  const delimiter = forceDelimiter != undefined ? forceDelimiter : "/";
  try {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: path,
        Delimiter: delimiter,
        MaxKeys: GetDirFilesPerRequest,
        ContinuationToken: continuationToken,
      }),
    );
    if (res.Contents) {
      for (const file of res.Contents) {
        if (
          file.Size == undefined ||
          file.LastModified == undefined ||
          file.Key == undefined
        ) {
          continue;
        }
        resObj.files.push({
          size: file.Size,
          lastModified: file.LastModified.toDateString(),
          name: file.Key,
        });
      }
    }

    if (res.CommonPrefixes) {
      for (const folder of res.CommonPrefixes) {
        if (!folder.Prefix) continue;
        resObj.folders.push({
          name: folder.Prefix,
        });
      }
    }
    resObj.nextContinuationToken = res.NextContinuationToken;
    resObj.success = true;
  } catch (e) {
    console.error("GetDir error", (e as Error).message);
  }

  return resObj;
};

/**
 * Creates an S3 bucket with the specified name and applies CORS configuration.
 *
 * @param bucketName - The name of the bucket to create. Must adhere to S3 bucket naming conventions.
 * @param applyCorsSync - Optional. If `true`, applies CORS configuration synchronously after bucket creation.
 *                        If `false` or not provided, applies CORS configuration asynchronously after a 3-second delay.
 *
 * @returns A promise that resolves to `true` if the bucket was created successfully, or `false` if an error occurred.
 *
 * @remarks
 * - The `applyCorsSync` parameter determines whether the CORS configuration is applied synchronously or asynchronously.
 * - If `applyCorsSync` is `false` or not provided, the logic applies CORS asynchronously using a `setTimeout` with a 3-second delay.
 * - If the CORS application fails, an error message is logged to the console.
 * - This logic ensures that CORS is always applied after bucket creation.
 */
export const createBucket = async (
  bucketName: string,
  applyCorsSync?: boolean
) => {
  try {
    checkBucketName(bucketName);

    await s3.send(
      new CreateBucketCommand({
        Bucket: bucketName,
        // CreateBucketConfiguration: {
        //   LocationConstraint: "us-east-2",
        // },
      }),
    );

    // cors needed to download files.
    // apply cors sync used for testing, or special purposes.
    // delay is required, as cors can only be applied on an existing bucket.
    if (applyCorsSync) {
      await sleep(1000);
      return await applyCors(bucketName);
    } else {
      setTimeout(() => applyCors(bucketName), 1000);
    }
  } catch (e) {
    console.log("create error", (e as Error).message);
    return false;
  }
  return true;
};

/**
 * Applies a CORS (Cross-Origin Resource Sharing) configuration to the specified S3 bucket.
 *
 * @param bucketName - The name of the S3 bucket to which the CORS configuration will be applied.
 *
 * @returns A promise that resolves to `true` if the CORS configuration was successfully applied, or `false` if an error occurred.
 *
 * @remarks
 * - This function uses the `PutBucketCorsCommand` from the AWS SDK to apply the CORS configuration.
 * - The CORS configuration allows `PUT` and `GET` methods from the origin specified in `env_vars.FE_ORIGIN`.
 * - All headers are allowed in the CORS configuration.
 * - If the operation fails, the function logs the error and returns `false`.
 */
const applyCors = async (bucketName: string) => {
  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedMethods: ["PUT", "GET"],
              AllowedOrigins: [env_vars.FE_ORIGIN],
              AllowedHeaders: ["*"],
            },
          ],
        },
      }),
    );
  } catch {
    return false;
  }
  return true;
};

/**
 * Retrieves the CORS (Cross-Origin Resource Sharing) configuration of the specified S3 bucket.
 *
 * @param bucketName - The name of the S3 bucket to retrieve the CORS configuration from.
 *
 * @returns A promise that resolves to the CORS configuration of the bucket, or `null` if no CORS configuration is set.
 *
 * @remarks
 * - This function uses the `GetBucketCorsCommand` from the AWS SDK to retrieve the CORS configuration.
 * - If the bucket does not have a CORS configuration or an error occurs, the function returns `null`.
 */
export const getCors = async (bucketName: string) => {
  try {
    const response = await s3.send(
      new GetBucketCorsCommand({
        Bucket: bucketName,
      }),
    );
    return response.CORSRules || null;
  } catch (e) {
    console.error("Error retrieving CORS configuration:", (e as Error).message);
    return null;
  }
};

/**
 * Deletes an S3 bucket and all its contents.
 *
 * @param bucketName - The name of the S3 bucket to delete.
 *
 * @returns A promise that resolves to `true` if the bucket was successfully deleted, or `false` if an error occurred.
 *
 * @remarks
 * - This function first empties the bucket by deleting all objects and subdirectories using the `deleteDir` function.
 * - After the bucket is emptied, it sends a `DeleteBucketCommand` to delete the bucket itself.
 * - If an error occurs during the process, the error message is logged to the console, and the function returns `false`.
 * - Ensure that the bucket exists and the AWS credentials have the necessary permissions to delete the bucket and its contents.
 */
export const deleteBucket = async (bucketName: string) => {
  try {
    // tries to empty bucket first
    try {
      await deleteDir({
        bucket: bucketName,
        path: "",
      });
    } catch {}

    // deletes bucket
    await s3.send(
      new DeleteBucketCommand({
        Bucket: bucketName,
      }),
    );
  } catch (e) {
    console.warn("hasom", (e as Error).message);
    return false;
  }
  return true;
};

/**
 * Waits until the specified S3 bucket exists or does not exist.
 *
 * @param bucketName - The name of the S3 bucket to check.
 * @param shouldExist - `true` to wait until the bucket exists, `false` to wait until it does not exist.
 * @param timeout - The maximum time (in milliseconds) to wait. Defaults to 5000ms.
 * @returns A promise that resolves when the bucket reaches the desired state, or rejects if the timeout is exceeded.
 *
 * @throws An error if the timeout is exceeded before the bucket reaches the desired state.
 */
export const waitForBucketExistState = async (
  bucketName: string,
  shouldExist: boolean,
  timeout: number = 5000,
): Promise<void> => {
  const startTime = Date.now();

  while (true) {
    const exists = await doesBucketExist(bucketName);
    console.log("checking", bucketName);
    if (exists === shouldExist) {
      return;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error(
        `Timeout exceeded while waiting for bucket "${bucketName}" to ${shouldExist ? "exist" : "not exist"}.`,
      );
    }
    await sleep(500); // Check every 500ms
  }
};

export const getBucketIDFromUserID = (userID: string) => {
  return ConvertToBase32(userID).toLowerCase();
};

export const getUserIDFromBucketID = (bucketID: string) => {
  return ExtractFromBase32(bucketID.toUpperCase());
};

// TODO: bugs

/**
 * Resets an S3 bucket by deleting it (and its contents) and then recreating it.
 *
 * @param bucketName - The name of the S3 bucket to reset.
 * @param options - Optional configuration for delays:
 *   - `deleteDelay` (number): Delay in milliseconds before deleting the bucket. Useful for testing.
 *   - `createDelay` (number): Delay in milliseconds before recreating the bucket. Useful for testing.
 *   - `applyCorsSync` (boolean): If `true`, applies CORS configuration synchronously after bucket creation.
 *   - `makeForbiddenException` (boolean): If `true`, allows exceptions for forbidden bucket names.
 *
 * @returns A promise that resolves to `true` if the bucket was successfully reset (deleted and recreated), or `false` if an error occurred.
 *
 * @remarks
 * - This function is primarily intended for testing purposes.
 * - The `deleteDelay` allows time to verify that the bucket has been successfully deleted before proceeding.
 * - The `createDelay` allows time to verify that the bucket has been successfully created after deletion.
 * - If the bucket deletion fails, the function will still attempt to create the bucket.
 * - Ensure that the AWS credentials have the necessary permissions to delete and create buckets.
 * - **Known Bugs**: The `deleteDelay` and `createDelay` options do not work as expected.
 */
export const resetAndCreateBucket = async (
  bucketName: string,
  options?: {
    deleteDelay?: number;
    createDelay?: number;
    applyCorsSync?: boolean;
  },
) => {
  const { deleteDelay, createDelay, applyCorsSync } =
    options || {};
  try {
    deleteDelay && (await sleep(deleteDelay));
    await deleteBucket(bucketName);
    console.log("deletedX(2je", deleteDelay);

    // await sleep(5000);
    // delete res does not matter
    // if create res fails, its because creation error, or bucket already exists
    createDelay && sleep(createDelay);
    // console.log('')
    const createRes = await createBucket(
      bucketName,
      applyCorsSync
    );
    console.log("creaetd", createDelay, createRes);
    return createRes;
    // return true;
  } catch (e) {
    console.warn("spooky", (e as Error).message);
    return false;
  }
};

/**
 * Checks if a user has the necessary permissions for a specific S3 bucket, path, and optionally a file.
 *
 * @param params - An object containing the parameters for the permission check:
 *   - `userID` (string): The ID of the user whose permissions are being checked.
 *   - `bucketName` (string): The name of the S3 bucket to check permissions for.
 *   - `path` (string): The path within the bucket to check permissions for.
 *   - `file` (Optional, string): The specific file within the path to check permissions for.
 *
 * @returns A promise that resolves to `true` if the user has valid permissions for the specified bucket, path, and file (if provided), or `false` otherwise.
 *
 * @remarks
 * - This function retrieves all shares (permissions) associated with the given `userID` and `bucketName` from the database using the `DBGet` function.
 * - The `queryTuple` array is dynamically constructed based on the provided parameters:
 *   - It always includes conditions for `users`, `bucketName`, and `path`.
 *   - If a `file` is provided, an additional condition for `file` is added to the query.
 * - The `DBGet` function is used to query the database with the constructed `queryTuple`.
 * - If the query returns exactly one result, the function returns `false` (indicating no valid permissions).
 * - If the query returns more than one result, the function returns `true` (indicating valid permissions).
 *
 * @example
 * ```typescript
 * const hasPermission = await checkUserPermissions({
 *   userID: "user123",
 *   bucketName: "my-s3-bucket",
 *   path: "path/to/directory",
 *   file: "file.txt"
 * });
 *
 * if (hasPermission) {
 *   console.log("User has permission to access the file.");
 * } else {
 *   console.log("User does not have permission to access the file.");
 * }
 * ```
 */
export const checkUserPermissions = async (params: {
  userID: string;
  bucketName: string;
  path: string;
  file?: string;
}) => {
  // owner don't need permission SON!
  const bucketOwnerID = getUserIDFromBucketID(params.bucketName);
  if (bucketOwnerID == params.userID) {
    // console.log("match", params.bucketName, bucketOwnerID);
    return true;
  }

  // get all permissions that involve this user and bucketName
  const shares = await getUserPermissions(params);
  console.log("existing shares", JSON.stringify(shares), '\n', JSON.stringify(params));

  // should have a valid share by this point, if not, false.
  return shares.length > 0;
};

/**
 * Retrieves all permissions (shares) for a specific user, bucket, path, and optionally a file.
 *
 * @param params - An object containing the parameters for the permission retrieval:
 *   - `userID` (string): The ID of the user whose permissions are being retrieved.
 *   - `bucketName` (string): The name of the S3 bucket to retrieve permissions for.
 *   - `path` (string): The path within the bucket to retrieve permissions for.
 *   - `file` (Optional, string): The specific file within the path to retrieve permissions for.
 *
 * @returns A promise that resolves to an array of `Share` objects representing the user's permissions.
 *
 * @remarks
 * - This function constructs a `queryTuple` array based on the provided parameters.
 * - The `queryTuple` is used to query the database for shares using the `DBGet` function.
 * - If a `file` is provided, an additional condition for `file` is added to the query.
 */
export const getUserPermissions = async (params: {
  userID: string;
  bucketName: string;
  path: string;
  file?: string;
}): Promise<(Share & DBObj)[]> => {
  const { userID, bucketName, path, file } = params;

  const query: queryTuple[] = [
    ["users", "array-contains", userID],
    ["bucketName", "==", bucketName],
    ["path", "in", [path]]
  ];

  // folder wide query first
  const folderWideShare = await DBGet("share", query);
  console.log('fwS getUserPerm shares', JSON.stringify(folderWideShare));
  const validDirWideShares: (Share & DBObj)[] = []; // all shares in given directory, even if they're file specific.
  for (const share of folderWideShare) {
    try {
      checkShare(share);
      validDirWideShares.push(share);
    } catch (e) {
      console.error("getUserPermissions", (e as Error).message);
    }
  }
  console.log('filewideshared after check len', validDirWideShares.length);

  
  if (file) {
    // if file is specified, then we need to look for a specific file share, or a dir wide share
    for (const share of validDirWideShares) {
      if (share.file == null || share.file == file) return [share];
    }
  } else {
    // if file isn't, we're looking for a folder wide share. (file is undefined for folder wide share)
    for (const share of validDirWideShares) {
      if (share.file == undefined) return [share];
    }
  }

  // if we made it to this point, the user doesn't have perms for that given directory or file
  // that said, they could have perms for a higher directory
  // e.g.: requesting for /a/b/c/ when they have perms for a/b/

  // turn path from /a/b/c/ into -> [a/, a/b, a/b/c/]
  const pathSplit = path.split('/');
  // always pop last item, as its probably an empty string
  pathSplit.pop();

  const nestedPaths: string[] = [];
  let currentNestedPath = '';
  nestedPaths.push(currentNestedPath);
  for (const pathChunk of pathSplit) {
    currentNestedPath += pathChunk + '/';
    nestedPaths.push(currentNestedPath);
  }
  
  // look for possible perms that 
  const pathPermQuery: queryTuple[] = [
    ["users", "array-contains", userID],
    ["bucketName", "==", bucketName],
    ["path", "in", nestedPaths],
    ['file', '==', null] // not looking for file level permissions this time.
  ];

  // folder wide query first
  const nestedFolderPermShares = await DBGet("share", pathPermQuery);
  console.log('nestedPathQuery', JSON.stringify(nestedFolderPermShares));
  const validNestedFolderPermShares: (Share & DBObj)[] = [];
  for (const share of nestedFolderPermShares) {
    try {
      checkShare(share);
      validNestedFolderPermShares.push(share);
    } catch (e) {
      console.error('invalid share', share, (e as Error).message);
      // TODO: don't fail silently
    }
  }

  return validNestedFolderPermShares;
};

export const addUserPermissions = async (params: {
  userID: string;
  bucketName: string;
  path: string;
  file?: string;
}) => {
  try {
    const { userID, bucketName, path, file } = params;

    // Check if a share already exists
    const existingShares = await getUserPermissions(params);
    if (existingShares.length > 0) {
      const existingShare = existingShares[0];

      // Add user to the existing share's user list
      if (!existingShare.users.includes(userID)) {
        existingShare.users.push(userID);
        await DBSetWithID("share", existingShare.id, existingShare);
      }
    } else {
      // Create a new share
      const newShare: Share = {
        bucketName,
        path,
        file: file || null,
        users: [userID],
      };
      await DBCreate("share", newShare);
      console.log('creating mud', newShare);
    }

    return true;
  } catch (e) {
    console.error("Error adding user permissions:", (e as Error).message);
    return false;
  }
};

export const removeUserPermissions = async (params: {
  userID: string;
  bucketName: string;
  path: string;
  file?: string;
}) => {
  try {
    const { userID } = params;

    // Check if a share exists
    const existingShares = await getUserPermissions(params);
    if (existingShares.length > 0) {
      const existingShare = existingShares[0];

      // Remove user from the existing share's user list
      const userIndex = existingShare.users.indexOf(userID);
      if (userIndex !== -1) {
        existingShare.users.splice(userIndex, 1);
      }
      if (existingShare.users.length === 0) {
        // Call the delete function if no users are left
        await DBDeleteWithID("share", existingShare.id);
      } else {
        // Otherwise, update the share with the modified user list
        await DBSetWithID("share", existingShare.id, existingShare);
      }
    }
    return true;
  } catch (e) {
    console.error("Error removing user permissions:", (e as Error).message);
    return false;
  }
};

/**
 * Checks if an S3 bucket exists.
 *
 * @param bucketName - The name of the S3 bucket to check.
 *
 * @returns A promise that resolves to `true` if the bucket exists, or `false` if it does not exist.
 *
 * @remarks
 * - This function sends a `HeadBucketCommand` to check if the bucket exists.
 * - If the bucket does not exist or an error occurs, the function returns `false`.
 */
export const doesBucketExist = async (bucketName: string): Promise<boolean> => {
  try {
    await s3.send(
      new HeadBucketCommand({
        Bucket: bucketName,
      }),
    );
    return true;
  } catch {
    return false;
  }
};
// export const getFilesInDir = async ({ bucket, path }: { bucket: string, path: string }) => {
//   const res = await s3.send(new ListObjectsV2Command({
//     Bucket: bucket,
//     Prefix: path,
//     Delimiter: "/",
//     MaxKeys: 130,
//   }));
//   console.log('getDir', res);
// }
