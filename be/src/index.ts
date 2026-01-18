import "./scripts/env_vars";
import express from "express";
import verifyUser, { GetSubIDFromHeaders } from "./middleware/VerifyUser";
import {
  checkUserPermissions,
  createBucket,
  createFolder,
  deleteDir,
  deleteFile,
  genSignedDownloadURL,
  genSignedUploadURL,
  getBucketIDFromUserID,
  getDir,
} from "./s3/s3";
import cors from "cors";
import { env_vars } from "./scripts/env_vars";
import { DBCreate, DBDeleteWithID, DBGet } from "./db/db";
import { UserObj } from "@shared/types/user/UserTypes";
import { sleep } from "./scripts/tools";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [env_vars.FE_ORIGIN],
  }),
);

app.post("/Initialize", verifyUser, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).send({
      error: "Missing email address",
    });
    return;
  }
  const subID = GetSubIDFromHeaders(req);

  // verify user doesn't exist
  const existingUser = await DBGet("user", [["subID", "==", subID]]);
  if (existingUser.length != 0) {
    res.status(200).send({});
    return;
  }

  // create user and bucket otherwise
  const user: UserObj = {
    email,
    subID: subID,
    username: email + "-user",
  };

  await DBCreate("user", user);
  await sleep(1000); // give network time to create user
  // there is a bug, where if two requests come in at the same time, a user is created twice.

  // check how many users with this subID exist now
  const existingUserPostCheck = await DBGet("user", [["subID", "==", subID]]);
  let userID = "";
  if (existingUserPostCheck.length > 1) {
    console.log("Duplicate users exist");
    // delete all users but the one with the highest ID.
    let highestID = existingUserPostCheck[0].id;
    for (let i = 1; i < existingUserPostCheck.length; i++) {
      if (existingUserPostCheck[i].id > highestID) {
        highestID = existingUserPostCheck[i].id;
      }
    }

    for (const user of existingUserPostCheck) {
      if (user.id == highestID) continue;
      try {
        await DBDeleteWithID("user", user.id);
      } catch {
        // no problem if failed, likely other request deleted user first.
      }
    }
    userID = highestID;
  } else {
    userID = existingUserPostCheck[0].id;
  }

  // lowercase base32 of userID is used to avoid uppercase letters used in userID
  // this approach keeps all userIDs unique
  const createBucketRes = await createBucket(getBucketIDFromUserID(userID));
  if (!createBucketRes) {
    res.send({
      error: "failed to create user bucket",
    });
    return;
  }

  // console.log(userID, createBucketRes);
  res.status(200).send({});
});

app.post("/GetDir", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req); // Assuming `verifyUser` middleware adds `user id` to `req.body`
  const { path, user, continuationToken } = req.body;

  if (path == undefined) {
    return res.status(400).json({ error: "Path is required" });
  }

  // console.warn("No bucket permission check yet");

  let bucketOwnerID = user;
  const userObjs = await DBGet("user", [["subID", "==", subID]]);
  if (!userObjs || userObjs.length == 0) {
    return res.status(400).json({ error: "Your account does not exist" });
  }
  const requestingUserID = userObjs[0].id;

  if (!bucketOwnerID) {
    // no passed bucketOwnerID, thus they are requesting their own contents
    bucketOwnerID = userObjs[0].id;
  }

  const bucketName = getBucketIDFromUserID(bucketOwnerID); // if user not passed, then request dir from user's bucket
  
  const permissionResponse = await checkUserPermissions({
    userID: requestingUserID,
    bucketName,
    path: path
  });
  if (!permissionResponse) {
    return res.status(400).json({ error: "You do not have permissions to do that" });
  }

  // console.log('getting', bucketName);
  const dirRes = await getDir({
    bucket: bucketName,
    path: path,
    continuationToken: continuationToken,
  });
  console.log("GetDir", dirRes);
  res.send(dirRes);
});

app.post("/GetUploadLink", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req);
  const { path, user, contentType } = req.body;

  console.warn("No perm check for DL");

  if (!contentType || !path) {
    return res.status(400).json({ error: "Path and contentType are required" });
  }

  let userID = user;
  if (!userID) {
    // no passed userID, thus they are requesting their own contents
    const userObjs = await DBGet("user", [["subID", "==", subID]]);
    if (!userObjs || userObjs.length == 0) {
      return res.status(400).json({ error: "Your account does not exist" });
    }
    userID = userObjs[0].id;
  }

  const bucketName = getBucketIDFromUserID(userID);

  // console.log('getting', bucketName);
  const uploadRes = await genSignedUploadURL({
    bucket: bucketName,
    key: path,
    contentType: contentType,
  });
  res.send({ url: uploadRes });
});

app.post("/GetDownloadLink", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req);
  const { path, user } = req.body;

  console.warn("No perm check for DL");

  let userID = user;
  if (!userID) {
    // no passed userID, thus they are requesting their own contents
    const userObjs = await DBGet("user", [["subID", "==", subID]]);
    if (!userObjs || userObjs.length == 0) {
      return res.status(400).json({ error: "Your account does not exist" });
    }
    userID = userObjs[0].id;
  }

  const bucketName = getBucketIDFromUserID(userID);

  // console.log('getting', bucketName);
  const downloadRes = await genSignedDownloadURL({
    bucket: bucketName,
    key: path,
  });
  res.send({ url: downloadRes });
});

app.post("/CreateFolder", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req);
  const { path, folderName, user } = req.body;

  console.warn("No perm check");

  let userID = user;
  if (!userID) {
    // no passed userID, thus they are requesting their own contents
    const userObjs = await DBGet("user", [["subID", "==", subID]]);
    if (!userObjs || userObjs.length == 0) {
      return res.status(400).json({ error: "Your account does not exist" });
    }
    userID = userObjs[0].id;
  }

  const bucketName = getBucketIDFromUserID(userID);

  // console.log('getting', bucketName);
  try {
    console.log('creating folder', path, folderName);
    const folderRes = await createFolder({
      bucket: bucketName,
      path: path,
      folderName: folderName,
    });
    console.log('created folder', path, folderName);
    res.send({});
  } catch (e) {
    console.log('error', (e as Error).message);
    res.status(403).send({
      error: (e as Error).message,
    });
  }
});

app.post("/GetDir", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req); // Assuming `verifyUser` middleware adds `user id` to `req.body`
  const { path, user, continuationToken } = req.body;

  if (path == undefined) {
    return res.status(400).json({ error: "Path is required" });
  }

  console.warn("No bucket permission check yet");

  let userID = user;
  if (!userID) {
    // no passed userID, thus they are requesting their own contents
    const userObjs = await DBGet("user", [["subID", "==", subID]]);
    if (!userObjs || userObjs.length == 0) {
      return res.status(400).json({ error: "Your account does not exist" });
    }
    userID = userObjs[0].id;
  }

  const bucketName = getBucketIDFromUserID(userID); // if user not passed, then request dir from user's bucket
  // console.log('getting', bucketName);
  const dirRes = await getDir({
    bucket: bucketName,
    path: path,
    continuationToken: continuationToken,
  });
  res.send(dirRes);
});

app.post("/DeleteFile", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req);
  const { path, user } = req.body;

  console.warn("No perm check");

  let userID = user;
  if (!userID) {
    // no passed userID, thus they are requesting their own contents
    const userObjs = await DBGet("user", [["subID", "==", subID]]);
    if (!userObjs || userObjs.length == 0) {
      return res.status(400).json({ error: "Your account does not exist" });
    }
    userID = userObjs[0].id;
  }

  const bucketName = getBucketIDFromUserID(userID);

  // console.log('getting', bucketName);
  const deleteRes = await deleteFile({
    bucket: bucketName,
    key: path,
  });
  if (!deleteRes) {
    return res.send({ error: "Failed to delete file" });
  }
  res.send({});
});

app.post("/DeleteFolder", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req);
  const { path, user } = req.body;

  console.warn("No perm check delete folder");

  let userID = user;
  if (!userID) {
    // no passed userID, thus they are requesting their own contents
    const userObjs = await DBGet("user", [["subID", "==", subID]]);
    if (!userObjs || userObjs.length == 0) {
      return res.status(400).json({ error: "Your account does not exist" });
    }
    userID = userObjs[0].id;
  }

  const bucketName = getBucketIDFromUserID(userID);

  // console.log('getting', bucketName);
  const deleteRes = await deleteDir({
    bucket: bucketName,
    path: path,
  });
  if (!deleteRes) {
    return res.send({ error: "Failed to delete folder" });
  }
  res.send({});
});

// app.post('/Share', verifyUser, async (req, res) => {
//   const subID = req.user.id;
//   const { fileName, permissions } = req.body;

//   if (!fileName || !permissions) {
//     return res.status(400).json({ error: 'File name and permissions are required' });
//   }

//   const bucketName = subID;

//   try {
//     // Update ACL for the file
//     await s3.putObjectAcl({
//       Bucket: bucketName,
//       Key: fileName,
//       ACL: permissions, // e.g., 'public-read', 'private'
//     }).promise();

//     res.json({ message: 'File permissions updated successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to update file permissions' });
//   }
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
