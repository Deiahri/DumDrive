// This is used for getting user input.
import { createInterface } from "node:readline/promises";

import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteBucketCommand,
  paginateListObjectsV2,
  GetObjectCommand,
  PutObjectCommandOutput,
} from "@aws-sdk/client-s3";

export async function main() {
  // A region and credentials can be declared explicitly. For example
  // `new S3Client({ region: 'us-east-1', credentials: {...} })` would
  //initialize the client with those settings. However, the SDK will
  // use your local configuration and credentials if those properties
  // are not defined here.
  const s3Client = new S3Client({});

  // Create an Amazon S3 bucket. The epoch timestamp is appended
  // to the name to make it unique.
  const bucketName = `drett-test-bucket-${Date.now()}`;
  await s3Client.send(
    new CreateBucketCommand({
      Bucket: bucketName,
    })
  );

  // Put an object into an Amazon S3 bucket.
  const objectKey = "my-first-object.txt";
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: "Hello JavaScript SDK!",
    })
  );

  // Read the object.
  const { Body } = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    })
  );

  if (Body) {
    console.log(await Body.transformToString());
  } else {
    console.log("Failed to fetch item in " + bucketName);
  }

  // Confirm resource deletion.
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const result = await prompt.question("Empty and delete bucket? (y/n) ");
  prompt.close();

  if (result === "y") {
    // Create an async iterator over lists of objects in a bucket.
    const paginator = paginateListObjectsV2(
      { client: s3Client },
      { Bucket: bucketName }
    );
    for await (const page of paginator) {
      const objects = page.Contents;
      if (objects) {
        // For every object in each page, delete it.
        for (const object of objects) {
          await s3Client.send(
            new DeleteObjectCommand({ Bucket: bucketName, Key: object.Key })
          );
        }
      }
    }

    // Once all the objects are gone, the bucket can be deleted.
    await s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
  }
}
// main();

import { ListObjectsV2Command } from "@aws-sdk/client-s3";

const currentBucketName = "drett-test-bucket-1768348669734";
const main2 = async () => {
  const s3Client = new S3Client({});

  // await s3Client.send(
  //   new CreateBucketCommand({
  //     Bucket: bucketName,
  //   })
  // );

  // creates a cool 2000 objects
  // for (let i = 0; i < 10; i++) {
  //   console.log('creating objects', i);
  //   const promises: Promise<PutObjectCommandOutput>[] = [];
  //   for (let j = 0; j < 100; j++) {
  //     promises.push(s3Client.send(new PutObjectCommand({
  //       Bucket: bucketName,
  //       Key: `Obj${i}-${j}`,
  //       Body: `${i}${j}|${Date.now()}`
  //     })));
  //   }
  //   await Promise.all(promises);
  // }

  const res = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: currentBucketName,
      MaxKeys: 10,
    })
  );

  console.log(res);
};
// main2();

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { deleteDir, getDir } from "./s3";
const main3 = async () => {
  const s3Client = new S3Client({});

  const getCommand = new GetObjectCommand({
    Bucket: "dretts-file-uploading-bucket",
    Key: "hqdefault.jpg",
  });

  const url = await getSignedUrl(s3Client, getCommand, {
    expiresIn: 180,
  });

  console.log(url);
};

// main3();

const main4 = async () => {
  // const promises: Promise<PutObjectCommandOutput>[] = [];

  // const s3 = new S3Client({ region: "us-east-2" });
  // for (let i = 0; i < 200; i++) {
  //   promises.push(
  //     s3.send(
  //       new PutObjectCommand({
  //         Bucket: "dretts-s3-classes",
  //         Key: `Folder0/FolderBolder/${i}.txt`,
  //         Body: `${i}-${i}!`
  //       })
  //     )
  //   );
  // }
  // await Promise.all(promises);
  // console.log('done');
  // return;
  const res = await getDir({
    bucket: "dretts-s3-classes",
    path: "Folder0/",
    // continuationToken:
    //   "1fG5cmn+2XpdI+PczMCiRAhOC9MHJd3nJqXTSkMzKbJVavd01HUYp63w4vm1CqjfnN7KsDfMS1K0='",
  });
  console.log(res);
};
// main4();


const main5 = async () => {
  // const r = await createBucket('bootyman');
  // console.log('created bucket:', r);

  const r = await deleteDir({
    bucket: "f57p4ya3cxw6wyk5f554re9gana3as9m",
    path: 'What in the world/'
  })
  // console.log('t', r);
}
// main5();