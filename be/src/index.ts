import "./scripts/env_vars";
import express from "express";
import verifyUser, { GetSubIDFromHeaders } from "./middleware/VerifyUser";
import {
  addUserPermissions,
  checkUserPermissions,
  createBucket,
  createFolder,
  deleteDir,
  deleteFile,
  genSignedDownloadURL,
  genSignedUploadURL,
  getBucketIDFromUserID,
  getDir,
  getDirOrFilePermissions,
  removeUserPermissions,
} from "./s3/s3";
import cors from "cors";
import { env_vars } from "./scripts/env_vars";
import { DBCreate, DBDeleteWithID, DBGet, DBGetWithID } from "./db/db";
import { UserObj } from "@shared/types/user/UserType";
import { sleep } from "./scripts/tools";
import { DBObj } from "@shared/types/db/DBTypes";
import { checkUserObj } from "@shared/types/user/UserCheck";

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
    email: email.toLowerCase(),
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
  const { path, continuationToken, bucket } = req.body;

  if (!bucket || typeof bucket != "string") {
    return res.status(400).json({ error: "Bucket is required" });
  }

  if (path == undefined) {
    return res.status(400).json({ error: "Path is required" });
  }

  // console.warn("No bucket permission check yet");

  const userObjs = await DBGet("user", [["subID", "==", subID]]);
  if (!userObjs || userObjs.length == 0) {
    return res.status(400).json({ error: "Your account does not exist" });
  }
  const requestingUserID = userObjs[0].id;

  const permissionResponse = await checkUserPermissions({
    userID: requestingUserID,
    bucketName: bucket,
    path: path,
    file: null,
  });

  if (!permissionResponse) {
    return res
      .status(400)
      .json({ error: "You do not have permissions to do that" });
  }

  // console.log('getting', bucketName);
  const dirRes = await getDir({
    bucket: bucket,
    path: path,
    continuationToken: continuationToken,
  });

  console.log("GetDir", dirRes);
  res.send(dirRes);
});

app.post("/GetUploadLink", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req);
  const { path, file, bucket, contentType } = req.body;

  console.warn("No perm check for DL");

  if (!contentType || !path || !file) {
    return res
      .status(400)
      .json({ error: "Path, contentType, and file are required" });
  }

  if (!bucket || typeof bucket != "string") {
    return res.status(400).json({ error: "No bucket found" });
  }

  const userObjs = await DBGet("user", [["subID", "==", subID]]);
  if (!userObjs || userObjs.length == 0) {
    return res.status(400).json({ error: "Your account does not exist" });
  }
  const requestingUserID = userObjs[0].id;

  // user must have access to this directory to upload a file
  const permissionResponse = await checkUserPermissions({
    userID: requestingUserID,
    bucketName: bucket,
    path: path,
    file: null,
  });

  if (!permissionResponse) {
    return res
      .status(400)
      .json({ error: "You do not have permissions to do that" });
  }

  // console.log('getting', bucketName);
  const uploadRes = await genSignedUploadURL({
    bucket: bucket,
    path: path,
    file: file,
    contentType: contentType,
  });
  res.send({ url: uploadRes });
});

app.post("/GetDownloadLink", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req);
  const { path, bucket, file } = req.body;

  // console.warn("No perm check for DL");

  if (!bucket || typeof bucket != "string") {
    return res.status(400).json({ error: "No bucket found" });
  }

  if (!path || !file) {
    return res.status(400).json({ error: "Path and file are required" });
  }

  const userObjs = await DBGet("user", [["subID", "==", subID]]);
  if (!userObjs || userObjs.length == 0) {
    return res.status(400).json({ error: "Your account does not exist" });
  }
  const requestingUserID = userObjs[0].id;

  // user must have access to this directory to upload a file
  const permissionResponse = await checkUserPermissions({
    userID: requestingUserID,
    bucketName: bucket,
    path: path,
    file: file,
  });

  if (!permissionResponse) {
    return res
      .status(400)
      .json({ error: "You do not have permissions to do that" });
  }

  // console.log('getting', bucketName);
  const downloadRes = await genSignedDownloadURL({
    bucket: bucket,
    path: path,
    file: file,
  });

  res.send({ url: downloadRes });
});

app.post("/CreateFolder", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req);
  const { path, folderName, bucket } = req.body;

  if (!bucket || typeof bucket != "string") {
    return res.status(400).json({ error: "No bucket found" });
  }

  const userObjs = await DBGet("user", [["subID", "==", subID]]);
  if (!userObjs || userObjs.length == 0) {
    return res.status(400).json({ error: "Your account does not exist" });
  }
  const requestingUserID = userObjs[0].id;

  // user must have access to this directory to upload a file
  const permissionResponse = await checkUserPermissions({
    userID: requestingUserID,
    bucketName: bucket,
    path: path,
    file: null,
  });

  if (!permissionResponse) {
    return res
      .status(400)
      .json({ error: "You do not have permissions to do that" });
  }

  // console.log('getting', bucketName);
  try {
    console.log("creating folder", path, folderName);
    await createFolder({
      bucket: bucket,
      path: path,
      folderName: folderName,
    });
    console.log("created folder", path, folderName);
    res.send({});
  } catch (e) {
    console.log("error", (e as Error).message);
    res.status(403).send({
      error: (e as Error).message,
    });
  }
});

app.post("/DeleteFile", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req);
  const { path, file, bucket } = req.body;

  if (!bucket || typeof bucket != "string") {
    return res.status(400).json({ error: "No bucket found" });
  }

  const userObjs = await DBGet("user", [["subID", "==", subID]]);
  if (!userObjs || userObjs.length == 0) {
    return res.status(400).json({ error: "Your account does not exist" });
  }
  const requestingUserID = userObjs[0].id;

  // user must have access to this directory to upload a file
  const permissionResponse = await checkUserPermissions({
    userID: requestingUserID,
    bucketName: bucket,
    path: path,
    file: file,
  });

  if (!permissionResponse) {
    return res
      .status(400)
      .json({ error: "You do not have permissions to do that" });
  }

  // console.log('getting', bucketName);
  const deleteRes = await deleteFile({
    bucket: bucket,
    path: path,
    file: file,
  });
  if (!deleteRes) {
    return res.send({ error: "Failed to delete file" });
  }
  res.send({});
});

app.post("/DeleteFolder", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req);
  const { path, bucket } = req.body;

  if (!bucket || typeof bucket != "string") {
    return res.status(400).json({ error: "No bucket found" });
  }

  const userObjs = await DBGet("user", [["subID", "==", subID]]);
  if (!userObjs || userObjs.length == 0) {
    return res.status(400).json({ error: "Your account does not exist" });
  }
  const requestingUserID = userObjs[0].id;

  // user must have access to this directory to upload a file
  const permissionResponse = await checkUserPermissions({
    userID: requestingUserID,
    bucketName: bucket,
    path: path,
    file: null,
  });

  if (!permissionResponse) {
    return res
      .status(400)
      .json({ error: "You do not have permissions to do that" });
  }

  // console.log('getting', bucketName);
  const deleteRes = await deleteDir({
    bucket: bucket,
    path: path,
  });

  if (!deleteRes) {
    return res.send({ error: "Failed to delete folder" });
  }
  res.send({});
});

app.post("/Share", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req);
  const { path, userIDs, emails, file, operation } = req.body;

  if (!path) {
    return res.status(400).json({ error: "Path parameter missing" });
  } else if ((!userIDs || !Array.isArray(userIDs)) && (!emails || !Array.isArray(emails))) {
    return res
      .status(400)
      .json({ error: "userIDs or emails parameter must be a non-empty array" });
  }

  if (operation !== "add" && operation !== "remove") {
    return res.status(400).json({ error: "operation must be add or remove" });
  }

  const ownerUserObj = await DBGet("user", [["subID", "==", subID]]);
  if (ownerUserObj.length === 0) {
    return res.status(400).json({ error: "Owner does not exist" });
  }
  const bucketName = getBucketIDFromUserID(ownerUserObj[0].id);

  const targetUserIDs: string[] = [];

  
  // TODO: make this operation more efficient.

  // Process userIDs
  if (userIDs && Array.isArray(userIDs)) {
    for (const userID of userIDs) {
      const getRes = await DBGetWithID("user", userID);
      if (getRes) {
        targetUserIDs.push(userID);
      } else {
        console.warn(`User with ID ${userID} not found`);
      }
    }
  }

  // Process emails
  if (emails && Array.isArray(emails)) {
    for (const email of emails) {
      const getRes = await DBGet("user", [["email", "==", email.toLowerCase()]]);
      if (getRes && getRes.length > 0) {
        targetUserIDs.push(getRes[0].id);
      } else {
        console.warn(`User with email ${email} not found`);
      }
    }
  }

  if (targetUserIDs.length === 0) {
    return res.status(400).json({ error: "No valid users found to share with" });
  }

  let operationResult;
  if (operation === "add") {
    operationResult = await addUserPermissions({
      bucketName: bucketName,
      userIDs: targetUserIDs,
      path: path,
      file: file,
    });
  } else if (operation === "remove") {
    // Assuming there's a removeUserPermissions function
    operationResult = await removeUserPermissions({
      bucketName: bucketName,
      userIDs: targetUserIDs,
      path: path,
      file: file,
    });
  }

  if (!operationResult) {
    return res.status(400).json({ error: `Failed to ${operation} users` });
  }

  res.send({
    userIDs: targetUserIDs,
  });
});

app.post("/getUsersInfo", verifyUser, async (req, res) => {
  let { userIDs } = req.body;

  const userObjs: { [key: string]: UserObj | undefined } = {};
  if (userIDs && (!Array.isArray(userIDs) || userIDs.length === 0)) {
    return res.status(400).json({ error: "userIDs must be a non-empty array" });
  } else if (!userIDs) {
    const subID = GetSubIDFromHeaders(req);
    const userRecords = await DBGet("user", [["subID", "==", subID]]);
    if (!userRecords || userRecords.length === 0) {
      return res.status(400).json({ error: "Your account does not exist" });
    }
    const userObj = userRecords[0];
    checkUserObj(userObj);
    userObjs[userObj.id] = userObj;
    return res.send(userObjs);
  }


  for (const userID of userIDs) {
    try {
      const userObj = (await DBGetWithID("user", userID)) as UserObj | undefined;
      if (userObj) {
        checkUserObj(userObj);
        userObjs[userID] = userObj;
      } else {
        console.warn(`User with ID ${userID} not found`);
        userObjs[userID] = undefined;
      }
    } catch (error) {
      console.warn(`Error fetching user with ID ${userID}:`, (error as Error).message);
      userObjs[userID] = undefined;
    }
  }

  res.send(userObjs);
});

app.post("/GetDirShareData", verifyUser, async (req, res) => {
  const subID = GetSubIDFromHeaders(req);
  const { bucket, path } = req.body;

  if (!bucket || path == undefined) {
    return res.status(400).json({ error: "Bucket and path are required" });
  }

  const userObjs = await DBGet("user", [["subID", "==", subID]]);
  if (!userObjs || userObjs.length === 0) {
    return res.status(400).json({ error: "Your account does not exist" });
  }

  const userID = userObjs[0].id;
  const userBucketID = getBucketIDFromUserID(userID);

  if (bucket !== userBucketID) {
    return res
      .status(403)
      .json({ error: "Not authorized to access this bucket" });
  }

  try {
    const shareData = await getDirOrFilePermissions({
      bucketName: bucket,
      path,
      file: null,
    });
    if (!shareData || shareData.length === 0) {
      return res.json([]);
    }
    res.json(shareData);
  } catch (error) {
    console.error(
      "Error fetching directory share data:",
      (error as Error).message,
    );
    res.status(500).json({ error: "Failed to fetch directory share data" });
  }
});


// app.post("/GetAllShareDataInBucket", verifyUser, async (req, res) => {
//   const subID = GetSubIDFromHeaders(req);
//   const { bucket, path } = req.body;

//   if (!bucket || !path) {
//     return res.status(400).json({ error: "Bucket and path are required" });
//   }

//   const userObjs = await DBGet("user", [["subID", "==", subID]]);
//   if (!userObjs || userObjs.length === 0) {
//     return res.status(400).json({ error: "Your account does not exist" });
//   }

//   const userID = userObjs[0].id;
//   const userBucketID = getBucketIDFromUserID(userID);

//   if (bucket !== userBucketID) {
//     return res
//       .status(403)
//       .json({ error: "Not authorized to access this bucket" });
//   }

//   try {
//     // TODO: shareData may be incomplete
//     const shareData = await DBGet('share', [['bucket', '==', bucket]]);
//     if (!shareData || shareData.length === 0) {
//       return res.json({});
//     }
//     res.json(shareData);
//   } catch (error) {
//     console.error(
//       "Error fetching directory share data:",
//       (error as Error).message,
//     );
//     res.status(500).json({ error: "Failed to fetch directory share data" });
//   }
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
