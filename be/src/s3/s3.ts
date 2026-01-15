import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetDirResponse } from "@shared/types/s3/S3Types";
import { ConvertToBase32 } from "../scripts/tools";

const s3 = new S3Client({
  // region: "us-east-2"
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
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
};

export const createFolder = async ({
  bucket,
  path,
}: {
  bucket: string;
  path: string;
}) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: path,
    })
  );
};

export const getDir = async ({
  bucket,
  path,
  continuationToken,
}: {
  bucket: string;
  path: string;
  continuationToken?: string;
}) => {
  const resObj: GetDirResponse = {
    files: [],
    folders: [],
    path: path,
    success: false,
  };

  try {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: path.replace(' ', '%20'),
        Delimiter: "/",
        MaxKeys: 100,
        ContinuationToken: continuationToken,
      })
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

    resObj.success = true;
  } catch (e) {
    console.error("GetDir error", (e as Error).message);
  }

  return resObj;
};

export const createBucket = async (bucketName: string) => {
  try {
    await s3.send(
      new CreateBucketCommand({
        Bucket: bucketName,
      })
    );
  } catch {
    return false;
  }
  return true;
};

export const getBucketIDFromUserID = (userID: string) => {
  return ConvertToBase32(userID).toLowerCase();
}

// export const getFilesInDir = async ({ bucket, path }: { bucket: string, path: string }) => {
//   const res = await s3.send(new ListObjectsV2Command({
//     Bucket: bucket,
//     Prefix: path,
//     Delimiter: "/",
//     MaxKeys: 130,
//   }));
//   console.log('getDir', res);
// }
