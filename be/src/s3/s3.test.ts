import { ForbiddenS3BucketPrefix } from "@shared/types/s3/S3Types";
import { beforeAll, describe, it, expect } from "vitest";
import {
  checkUserPermissions,
  createBucket,
  createFile,
  deleteBucket,
  deleteDir,
  doesBucketExist,
  getBucketIDFromUserID,
  getCors,
  getDir,
  resetAndCreateBucket,
  waitForBucketExistState,
} from "./s3";
import { sleep } from "../scripts/tools";
import { checkBucketName } from "@shared/types/s3/S3Check";
import { GetDirFilesPerRequest } from "@shared/types/s3/s3Data";

const bucketPrefix: ForbiddenS3BucketPrefix = "s3test";

describe("s3.test.ts", async () => {
  // const s3ResetAndCreateBucketName = bucketPrefix + "-reset-and-create";
  // describe("resetAndCreateBucket", async () => {
  //   it("Should create and destry", async () => {
  //     checkBucketName(s3ResetAndCreateBucketName, true);
  //     const response = await resetAndCreateBucket(s3ResetAndCreateBucketName, {
  //       makeForbiddenException: true,
  //     });
  //     expect(response).toBe(true);
  //   });
  // });

  // const createBucketName = bucketPrefix + "-create-bucket-test";
  // describe("createBucket", async () => {
  //   it("should delete the bucket if it exists, create a new bucket, and verify its existence", async () => {
  //     // Ensure the bucket does not exist
  //     await deleteBucket(createBucketName);

  //     // Create the bucket
  //     const createResponse = await createBucket(createBucketName, true, true);
  //     expect(createResponse).toBe(true);

  //     // Verify the bucket exists
  //     expect(
  //       async () =>
  //         await waitForBucketExistState(createBucketName, true, 10000),
  //     ).not.toThrow();

  //     // Get CORS settings and ensure they are not null
  //     const corsSettings = await getCors(createBucketName);
  //     expect(corsSettings).not.toBeNull();
  //   }, 15000);
  // });

  // const deleteBucketName = bucketPrefix + "-delete-bucket-test";
  // describe("deleteBucket", async () => {
  //   it("should create a bucket, delete it, and verify it no longer exists", async () => {
  //     // Create the bucket (disregard output)
  //     await createBucket(deleteBucketName, true, true);

  //     // Delete the bucket
  //     const deleteResponse = await deleteBucket(deleteBucketName);
  //     expect(deleteResponse).toBe(true);

  //     // Verify the bucket no longer exists
  //     expect(
  //       async () =>
  //         await waitForBucketExistState(deleteBucketName, false, 10000),
  //     ).not.toThrow();
  //   }, 15000);
  // });

  // const getDirBucketName = bucketPrefix + "-get-dir-test";
  // describe("getDir", async () => {
  //   it("should delete bucket before testing", async () => {
  //     // Ensure the bucket is deleted if it exists
  //     await deleteBucket(getDirBucketName);
  //     expect(
  //       async () =>
  //         await waitForBucketExistState(getDirBucketName, false, 10000),
  //     );
  //   }, 15000);

  //   it("should return an empty GetDirResponse with success false if the bucket doesn't exist", async () => {
  //     // Check if the bucket exists
  //     const bucketExists = await doesBucketExist(getDirBucketName);
  //     expect(bucketExists).toBe(false);
  //     const response = await getDir({ bucket: getDirBucketName, path: "" });
  //     expect(response).toEqual({
  //       files: [],
  //       folders: [],
  //       path: "",
  //       success: false,
  //     });
  //   });

  //   it("should return an empty GetDirResponse with success true after creating the bucket", async () => {
  //     await createBucket(getDirBucketName, true, true);
  //     const response = await getDir({ bucket: getDirBucketName, path: "" });
  //     expect(response).toEqual({
  //       files: [],
  //       folders: [],
  //       path: "",
  //       success: true,
  //     });
  //   });

  //   it("should return one file after adding a file to the bucket", async () => {
  //     const fileName = "test.txt";
  //     const fileBody = "Non-empty string";

  //     // Add a file to the bucket
  //     await createFile({
  //       bucket: getDirBucketName,
  //       path: "",
  //       fileName,
  //       body: fileBody,
  //     });

  //     // Get directory contents
  //     const response = await getDir({ bucket: getDirBucketName, path: "" });
  //     expect(response.success).toBe(true);
  //     expect(response.files).toHaveLength(1);
  //     expect(response.files[0]).toEqual(
  //       expect.objectContaining({
  //         name: fileName,
  //         size: fileBody.length,
  //       }),
  //     );
  //     expect(response.folders).toHaveLength(0);
  //   });

  //   it("should handle multiple files and return correct continuation tokens", async () => {
  //     // deletes all files in the directory first.
  //     const res = await deleteDir({
  //       bucket: getDirBucketName,
  //       path: "",
  //     });
  //     expect(res).toBe(true);

  //     const filePrefix = "file-";
  //     const fileBody = "Sample content";
  //     const totalFiles = GetDirFilesPerRequest + 50; // More than the max files per request

  //     // Add multiple files to the bucket
  //     const fileCreationPromises = [];
  //     for (let i = 0; i < totalFiles; i++) {
  //       fileCreationPromises.push(
  //         createFile({
  //           bucket: getDirBucketName,
  //           path: "",
  //           fileName: `${filePrefix}${i}.txt`,
  //           body: fileBody,
  //         }),
  //       );
  //     }
  //     await Promise.all(fileCreationPromises);

  //     // Get the first batch of files (max files per request)
  //     const firstBatch = await getDir({ bucket: getDirBucketName, path: "" });
  //     expect(firstBatch.success).toBe(true);
  //     expect(firstBatch.files).toHaveLength(GetDirFilesPerRequest);
  //     expect(firstBatch.nextContinuationToken).toBeDefined();

  //     // Get the second batch of files using the continuation token
  //     const secondBatch = await getDir({
  //       bucket: getDirBucketName,
  //       path: "",
  //       continuationToken: firstBatch.nextContinuationToken,
  //     });
  //     expect(secondBatch.success).toBe(true);
  //     expect(secondBatch.files).toHaveLength(
  //       totalFiles - GetDirFilesPerRequest,
  //     ); // Remaining files
  //     expect(secondBatch.nextContinuationToken).toBeUndefined();

  //     // Verify all files are accounted for
  //     const allFiles = [...firstBatch.files, ...secondBatch.files];
  //     expect(allFiles).toHaveLength(totalFiles);
  //     for (let i = 0; i < totalFiles; i++) {
  //       expect(allFiles).toContainEqual(
  //         expect.objectContaining({
  //           name: `${filePrefix}${i}.txt`,
  //           size: fileBody.length,
  //         }),
  //       );
  //     }
  //   }, 50000);
  // });

  describe("checkUserPermissions", async () => {
    it("should return true if the user owns the bucket, regardless of file or path", async () => {
      const testUser = "usapaloosa";
      const bucketName = getBucketIDFromUserID(testUser);

      const testCases = [
        { userID: testUser, bucketName, path: "", file: undefined },
        { userID: testUser, bucketName, path: "folder1/", file: undefined },
        { userID: testUser, bucketName, path: "folder2/", file: "file1.txt" },
        {
          userID: testUser,
          bucketName,
          path: "folder3/subfolder/",
          file: "file2.txt",
        },
        { userID: testUser, bucketName, path: "folder4/", file: "file3.txt" },
      ];

      for (const testCase of testCases) {
        const response = await checkUserPermissions(testCase);
        expect(response).toBe(true);
      }
    });
  });
});
