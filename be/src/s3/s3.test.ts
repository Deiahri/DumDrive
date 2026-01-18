// import { ForbiddenS3BucketPrefix } from "@shared/types/s3/S3Types";
import { beforeAll, describe, it, expect } from "vitest";
import {
  addUserPermissions,
  checkUserPermissions,
  createBucket,
  createFile,
  deleteBucket,
  deleteDir,
  doesBucketExist,
  getBucketIDFromUserID,
  getCors,
  getDir,
  getUserPermissions,
  removeUserPermissions,
  resetAndCreateBucket,
  waitForBucketExistState,
} from "./s3";
import { checkBucketName } from "@shared/types/s3/S3Check";
import { GetDirFilesPerRequest } from "@shared/types/s3/s3Data";
import { DocumentTestKey } from "@shared/types/db/DBData";
import { DBCreate, DBGet } from "../db/db";

const bucketPrefix = "s3test";

describe("s3.test.ts", async () => {
  // const s3ResetAndCreateBucketName = bucketPrefix + "-reset-and-create";
  // describe("resetAndCreateBucket", async () => {
  //   it("Should create and destry", async () => {
  //     checkBucketName(s3ResetAndCreateBucketName);
  //     const response = await resetAndCreateBucket(s3ResetAndCreateBucketName);
  //     expect(response).toBe(true);
  //   });
  // });

  // const createBucketName = getBucketIDFromUserID(bucketPrefix + "-create-bucket-test"); // converted to bucket name
  // describe("createBucket", async () => {
  //   it("should delete the bucket if it exists, create a new bucket, and verify its existence", async () => {
  //     // Ensure the bucket does not exist
  //     await deleteBucket(createBucketName);

  //     // Create the bucket
  //     const createResponse = await createBucket(createBucketName, true);
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
  //     await createBucket(deleteBucketName, true);

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
  //     ).not.toThrow();
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
  //     await createBucket(getDirBucketName, true);
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
    describe("initial tests", () => {
      const noiseBucketName = getBucketIDFromUserID("test-bucket-created"); // translaed to something acceptable.
      const testShares = Array.from({ length: 10 }, (_, i) => ({
        bucketName: noiseBucketName,
        path: `test-path-${i}`,
        file: `test-file-${i}.txt`,
        users: [`user${i}`],
        [DocumentTestKey]: true,
      }));

      it("should create multiple test share documents as noise", async () => {
        // Create all test share documents in parallel
        await Promise.all(testShares.map((share) => DBCreate("share", share)));

        // Verify that the documents were created
        const createdShares = await DBGet("share", [
          [DocumentTestKey, "==", true],
          ["bucketName", "==", noiseBucketName],
        ]);
        expect(createdShares).toHaveLength(testShares.length);

        const testShare = testShares[0];
        const res = await DBGet("share", [
          ["users", "array-contains", testShare.users[0]],
          ["bucketName", "==", testShare.bucketName],
          ["path", "==", testShare.path],
          ["file", "==", testShare.file],
        ]);
        expect(res.length).toBe(1);
      });

      it("should return true for checkUserPermissions with test share data", async () => {
        for (const share of testShares) {
          const response = await checkUserPermissions({
            userID: share.users[0],
            bucketName: share.bucketName,
            path: share.path,
            file: share.file,
          });
          expect(response).toBe(true);
        }
      });
    });

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

    it("should return false if the bucket does not exist, regardless of user, file, or path", async () => {
      const testUser = "usapaloosa";
      const bucketName = "non-existent";

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
        expect(response).toBe(false);
      }
    });

    const rootTestUser = "test-bucket-access";
    it("should return false if bucket exists, but user doesn't have access", async () => {
      const bucketName = getBucketIDFromUserID(rootTestUser);
      const testUser = "user-no-access";

      // Create the bucket
      await createBucket(bucketName, true);
      expect(
        async () => await waitForBucketExistState(bucketName, true, 10000),
      ).not.toThrow();

      const response = await checkUserPermissions({
        userID: testUser,
        bucketName,
        path: "",
      });
      expect(response).toBe(false);
    });

    it("should return false if bucket exists, user has permissions, but user doesn't have permissions to the specified file or folder", async () => {
      const bucketName = getBucketIDFromUserID(rootTestUser);
      const testUser = "user-limited-access";

      // Add user permissions for a specific file
      const addPermissionResponse = await addUserPermissions({
        userID: testUser,
        bucketName,
        path: "folder1/",
        file: "file1.txt",
      });
      expect(addPermissionResponse).toBe(true);

      // Check permissions for a different file
      const response = await checkUserPermissions({
        userID: testUser,
        bucketName,
        path: "folder1/",
        file: "file2.txt",
      });
      expect(response).toBe(false);
    });

    it("should return true if bucket exists and user has permissions to the given file", async () => {
      const bucketName = getBucketIDFromUserID(rootTestUser);
      const testUser = "user-file-access";

      // Add user permissions for a specific file
      const addPermissionResponse = await addUserPermissions({
        userID: testUser,
        bucketName,
        path: "folder1/",
        file: "file1.txt",
      });
      expect(addPermissionResponse).toBe(true);

      const response = await checkUserPermissions({
        userID: testUser,
        bucketName,
        path: "folder1/",
        file: "file1.txt",
      });
      expect(response).toBe(true);
    });

    it("should return false if bucket exists, and user only has permission to a given file but not folder (test with files in that folder)", async () => {
      const bucketName = getBucketIDFromUserID(rootTestUser);
      const testUser = "user-file-only-access";

      // Add user permissions for a specific file
      const addPermissionResponse = await addUserPermissions({
        userID: testUser,
        bucketName,
        path: "folder1/",
        file: "file1.txt",
      });
      expect(addPermissionResponse).toBe(true);

      // Check permissions for the file
      const fileResponse = await checkUserPermissions({
        userID: testUser,
        bucketName,
        path: "folder1/",
        file: "file1.txt",
      });
      expect(fileResponse).toBe(true);

      // Check permissions for the folder
      const response = await checkUserPermissions({
        userID: testUser,
        bucketName,
        path: "folder1/",
      });
      expect(response).toBe(false);
    });

    it("should return true if bucket exists and user has permissions to the given folder (even with files in that folder)", async () => {
      const bucketName = getBucketIDFromUserID(rootTestUser);
      const testUser = "user-folder-access";

      // Add user permissions for the folder
      const addPermissionResponse = await addUserPermissions({
        userID: testUser,
        bucketName,
        path: "folder1/",
      });
      expect(addPermissionResponse).toBe(true);

      // Check permissions for the folder
      const response = await checkUserPermissions({
        userID: testUser,
        bucketName,
        path: "folder1/",
      });
      expect(response).toBe(true);

      // Check permissions for a file in the folder
      const fileResponse = await checkUserPermissions({
        userID: testUser,
        bucketName,
        path: "folder1/",
        file: "file1.txt",
      });
      expect(fileResponse).toBe(true);

      // Check permissions for another file in the folder
      const file2Response = await checkUserPermissions({
        userID: testUser,
        bucketName,
        path: "folder1/",
        file: "file2.txt",
      });
      expect(file2Response).toBe(true);
    });

    it("should return false if bucket exists and checking permissions for /a/b, but the user has permissions to /a/b/c but not /a/b", async () => {
      const bucketName = getBucketIDFromUserID(rootTestUser);
      const testUser = "user-nested-access";

      // Add user permissions for a nested folder
      const addPermissionResponse = await addUserPermissions({
        userID: testUser,
        bucketName,
        path: "a/b/c/",
      });
      expect(addPermissionResponse).toBe(true);

      // Check permissions for the parent folder
      const response = await checkUserPermissions({
        userID: testUser,
        bucketName,
        path: "a/b/",
      });
      expect(response).toBe(false);
    });

    it("should return true if bucket exists and checking for permissions for /a/b, and the user has permissions to /a", async () => {
      const bucketName = getBucketIDFromUserID(rootTestUser);
      const testUser = "user-parent-access";

      // Add user permissions for the parent folder
      const addPermissionResponse = await addUserPermissions({
        userID: testUser,
        bucketName,
        path: "a/",
      });
      expect(addPermissionResponse).toBe(true);

      // Check permissions for the child folder
      const response = await checkUserPermissions({
        userID: testUser,
        bucketName,
        path: "a/b/",
      });
      expect(response).toBe(true);
    });

    it("should return true for everything if user has permissions to '' (base dir)", async () => {
      const bucketName = getBucketIDFromUserID(rootTestUser);
      const testUser = "user-base-access";

      // Add user permissions for the base directory
      const addPermissionResponse = await addUserPermissions({
        userID: testUser,
        bucketName,
        path: "",
      });
      expect(addPermissionResponse).toBe(true);

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

    it("should return true if user has access to a specific base dir file, but false for any other kind of access", async () => {
      const bucketName = getBucketIDFromUserID(rootTestUser);
      const testUser = "user-specific-file-access";

      // Add user permissions for a specific file in the base directory
      const addPermissionResponse = await addUserPermissions({
        userID: testUser,
        bucketName,
        path: "",
        file: "base-file.txt",
      });
      expect(addPermissionResponse).toBe(true);

      const testCases = [
        {
          userID: testUser,
          bucketName,
          path: "",
          file: "base-file.txt",
          expected: true,
        },
        {
          userID: testUser,
          bucketName,
          path: "",
          file: undefined,
          expected: false,
        },
        {
          userID: testUser,
          bucketName,
          path: "folder1/",
          file: undefined,
          expected: false,
        },
        {
          userID: testUser,
          bucketName,
          path: "folder2/",
          file: "file1.txt",
          expected: false,
        },
      ];

      for (const testCase of testCases) {
        const response = await checkUserPermissions({
          userID: testCase.userID,
          bucketName: testCase.bucketName,
          path: testCase.path,
          file: testCase.file,
        });
        expect(response).toBe(testCase.expected);
      }
    });
  });

  describe("removeUserPermissions", () => {
    const testBucketName = getBucketIDFromUserID(
      `${bucketPrefix}-remove-user-permissions-test`,
    );
    const testUser = "test-user";
    const testPath = "test-path";
    const testFile = "test-file.txt";

    it("should set up the test environment by creating the bucket and adding user permissions", async () => {
      // Ensure the bucket exists
      await createBucket(testBucketName, true);
      // Add user permissions to the bucket, path, and file
      await addUserPermissions({
        userID: testUser,
        bucketName: testBucketName,
        path: testPath,
        file: testFile,
      });
    });

    it("should remove user permissions for a specific file", async () => {
      // Remove user permissions for the specific file
      const result = await removeUserPermissions({
        userID: testUser,
        bucketName: testBucketName,
        path: testPath,
        file: testFile,
      });

      expect(result).toBe(true);

      // Verify the user no longer has permissions for the file
      const permissions = await getUserPermissions({
        userID: testUser,
        bucketName: testBucketName,
        path: testPath,
        file: testFile,
      });

      expect(permissions).toHaveLength(0);
    });

    it("should remove user permissions for a specific path", async () => {
      // Add user permissions again for the path
      await addUserPermissions({
        userID: testUser,
        bucketName: testBucketName,
        path: testPath,
      });

      // Remove user permissions for the path
      const result = await removeUserPermissions({
        userID: testUser,
        bucketName: testBucketName,
        path: testPath,
      });

      expect(result).toBe(true);

      // Verify the user no longer has permissions for the path
      const permissions = await getUserPermissions({
        userID: testUser,
        bucketName: testBucketName,
        path: testPath,
      });

      expect(permissions).toHaveLength(0);
    });

    it("should handle removing permissions for a non-existent user gracefully", async () => {
      const nonExistentUser = "non-existent-user";

      // Attempt to remove permissions for a non-existent user
      const result = await removeUserPermissions({
      userID: nonExistentUser,
      bucketName: testBucketName,
      path: testPath,
      });

      // Since the system doesn't check if the user exists, it should still return true
      expect(result).toBe(true);
    });

    it("should handle removing permissions for a non-existent bucket gracefully", async () => {
      const nonExistentBucket = `${bucketPrefix}-non-existent-bucket`;

      // Attempt to remove permissions for a non-existent bucket
      const result = await removeUserPermissions({
        userID: testUser,
        bucketName: nonExistentBucket,
        path: testPath,
      });

      expect(result).toBe(true); // it will succeed in the removal, as it doesn't check for if the user exists or not.
    });
  });
});
