"use client";

import useAuthedFetch from "@/app/_hooks/useAuthedFetch";
import useCustomSearchParams from "@/app/_hooks/useCustomSearchParams";
import { env_vars } from "@/app/_tools/env_vars";
import { checkGetDirResponse } from "@shared/types/s3/S3Check";
import { GetDirResponse } from "@shared/types/s3/S3Types";
import { useEffect } from "react";
import { FaFile } from "react-icons/fa";
import { FaDownload, FaFolder, FaTrash } from "react-icons/fa6";
import { useAppContext } from "../_context/AppContext";
import { Share } from "@shared/types/share/ShareType";
import { checkShare } from "@shared/types/share/ShareCheck";

export default function DirRenderer({
  path,
  user,
  bucket,
}: {
  path?: string;
  user?: string;
  bucket?: string;
}) {
  const { updateParams } = useCustomSearchParams();
  const AuthedFetch = useAuthedFetch();
  const {
    DirData,
    setDirData,
    DirDataCache,
    setDirDataCache,
    userObj,
    setDirShareCache,
    DirShareCache,
  } = useAppContext();

  const handleFolderClick = (folder: string) => {
    updateParams({ p: folder }, false);
  };

  const controller = new AbortController();

  useEffect(() => {
    if (!bucket) return;
    if (!userObj) return;
    const makeFetch = async () => {
      if (DirDataCache[path || ""]) {
        // console.log('set from cache', DirDataCache[path || ""]);
        setDirData(DirDataCache[path || ""]);
      } else {
        setDirData("loading");
      }
      try {
        console.log(`${env_vars.BACKEND_URL}/GetDir`);
        const res = await (
          await AuthedFetch(`${env_vars.BACKEND_URL}/GetDir`, {
            method: "POST",
            body: JSON.stringify({
              user,
              path: path || "",
              bucket,
            }),
          })
        ).json();

        console.log(res);
        if (res.error) {
          console.error(res.error);
          setDirData("failed");
          return;
        }
        checkGetDirResponse(res);

        setDirDataCache({
          ...DirDataCache,
          [bucket]: {
            ...DirDataCache[bucket],
            [path || ""]: res,
          },
        });
        console.log("Dir", res);
        setDirData(res);
      } catch (e) {
        console.error((e as Error).message);
        setDirData("failed");
      }
    };
    makeFetch();

    return () => {
      controller.abort();
    };
  }, [path, user, userObj, bucket]);

  // fetches current dir share data
  useEffect(() => {
    if (!bucket) return;
    const makeFetch = async () => {
      try {
        console.log(`${env_vars.BACKEND_URL}/GetDirShareData`);
        const res = await (
          await AuthedFetch(`${env_vars.BACKEND_URL}/GetDirShareData`, {
            method: "POST",
            body: JSON.stringify({
              path: path || "",
              bucket,
            }),
          })
        ).json();

        console.log(res);
        if (res.error) {
          console.error(res.error);
          setDirData("failed");
          return;
        }

        const shareArr: Share[] = [];
        for (const share of res) {
          try {
            checkShare(share);
            shareArr.push(share);
          } catch {}
        }

        setDirShareCache({
          ...DirShareCache,
          [bucket]: {
            ...DirShareCache[bucket],
            [path || ""]: shareArr,
          },
        });
      } catch (e) {
        console.error((e as Error).message);
        setDirData("failed");
      }
    };
    makeFetch();

    return () => {
      controller.abort();
    };
  }, [path, user, bucket]);

  const handleDownload = async (key: string, fileName: string) => {
    try {
      const keySplit = key.split("/");
      keySplit.pop();
      keySplit.pop(); // pop last two items (empty string and file name)

      let pathStr = "";
      for (const currentKey of keySplit) {
        pathStr += currentKey + "/";
      }

      const res = await (
        await AuthedFetch(`${env_vars.BACKEND_URL}/GetDownloadLink`, {
          method: "POST",
          body: JSON.stringify({
            path: pathStr,
            file: fileName,
            user: user,
            bucket,
          }),
        })
      ).json();

      const { url } = res;
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      const fileNameSplit = key.split(".");
      const ext = fileNameSplit[fileNameSplit.length - 1];
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {}
  };

  const handleDelete = async (key: string, fileName: string) => {
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      try {
        const newDirData = { ...(DirData as GetDirResponse) };
        // set file to loading
        newDirData.files = newDirData.files.map((file) =>
          file.name == key ? { ...file, isLoading: true } : file,
        );
        setDirData(newDirData);

        const keySplit = key.split("/");
        keySplit.pop();
        keySplit.pop(); // pop last two items (empty string and file name)

        let pathStr = "";
        for (const currentKey of keySplit) {
          pathStr += currentKey + "/";
        }

        const res = await AuthedFetch(`${env_vars.BACKEND_URL}/DeleteFile`, {
          method: "POST",
          body: JSON.stringify({
            path: pathStr,
            file: fileName,
            user: user,
            bucket,
          }),
        });

        console.log("done loading");
        const result = await res.json();
        if (result.error) {
          alert(`Failed to delete ${fileName}: ${result.error}`);
          newDirData.files = newDirData.files.map((file) =>
            file.name == key ? { ...file, isLoading: false } : file,
          );
          setDirData(newDirData);
        } else {
          // alert(`${fileName} has been deleted successfully.`);
          // Optionally refresh the directory data
          const newerDirData = { ...newDirData };
          newerDirData.files = newerDirData.files.filter(
            (file) => file.name != key,
          );
          setDirData(newerDirData);
        }
      } catch (error) {
        console.error(error);
        alert(`An error occurred while deleting ${fileName}.`);
      }
    }
  };

  const handleFolderDelete = async (key: string, folderName: string) => {
    if (confirm(`Are you sure you want to delete folder \"${folderName}\"?`)) {
      try {
        const premptiveDirData: GetDirResponse = {
          ...(DirData as GetDirResponse),
        };
        console.log("dajjwd", premptiveDirData.files[0]);
        premptiveDirData.files = premptiveDirData.files.map((file) =>
          file.name == key ? { ...file, isLoading: true } : file,
        );
        setDirData(premptiveDirData);
        console.log("set");
        const res = await AuthedFetch(`${env_vars.BACKEND_URL}/DeleteFolder`, {
          method: "POST",
          body: JSON.stringify({
            path: key,
            user: user,
            bucket,
          }),
        });
        console.log("done");

        const result = await res.json();
        if (result.error) {
          alert(`Failed to delete ${folderName}: ${result.error}`);
          setDirData(DirData);
        } else {
          // alert(`${folderName} has been deleted successfully.`);
          // Optionally refresh the directory data
          setDirData((prevData: GetDirResponse) => ({
            ...prevData,
            folders: prevData.folders.filter((folder) => folder.name !== key),
          }));
        }
      } catch (error) {
        console.error(error);
        alert(`An error occurred while deleting ${folderName}.`);
      }
    }
  };

  if (DirData == "failed" || DirData == "loading" || !DirData) return null;

  console.log('isEM', DirData);
  const isEmpty =
    (DirData.files.length == 0 ||
      (DirData.files.length == 1 && DirData.files[0].name == path)) &&
    DirData.folders.length == 0;
  if (isEmpty) {
    return <span>Nothing in here mate.</span>;
  }
  // console.log(DirData);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.5rem",
        }}
      >
        {DirData.folders.map((folder) => {
          const folderSplit = folder.name.split("/");
          const folderName = folderSplit[folderSplit.length - 2]; // Trim off the last character
          return (
            <Folder
              key={folder.name}
              name={folderName}
              isLoading={folder.isLoading}
              onClick={() => handleFolderClick(folder.name)}
              onDelete={() => handleFolderDelete(folder.name, folderName)}
            />
          );
        })}
      </div>

      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "0.5rem",
        }}
      >
        {DirData.files.map((file, index) => {
          // const fileName = file.name.slice(0, -1); // Trim off the last character
          if (file.name == path) return;
          const fileNameSplit = file.name.split("/");
          const fileName = fileNameSplit[fileNameSplit.length - 1];
          return (
            <File
              key={file.name}
              name={fileName}
              isLoading={file.isLoading}
              onDownload={() => handleDownload(file.name, fileName)}
              onClick={() => console.log(`Clicked on File ${index + 1}`)}
              onDelete={() => handleDelete(file.name, fileName)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Folder({
  name,
  onClick,
  onDelete,
  isLoading,
}: {
  name: string;
  onClick: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}) {
  return (
    <div
      // onClick={onClick}
      style={{
        opacity: !isLoading ? 1 : 0.5,
        pointerEvents: !isLoading ? "initial" : "none",
        width: "100%",
        height: "100%",
        borderRadius: "0.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "1rem",
        boxSizing: "border-box",
        backgroundColor: "#3a3a3a",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        position: "relative",
      }}
    >
      <div style={{ marginRight: "0.5rem" }}>
        <FaFolder />
      </div>
      <span
        onClick={onClick}
        style={{
          fontSize: "1rem",
          fontWeight: "500",
          width: "100%",
          cursor: "pointer",
        }}
      >
        {name}
      </span>
      <div
        style={{
          position: "absolute",
          right: "0.5rem",
          top: "0.5rem",
          cursor: "pointer",
          padding: "0.5rem 0.5rem",
        }}
        onClick={() => onDelete && onDelete()}
      >
        <FaTrash />
      </div>
    </div>
  );
}

function File({
  name,
  isLoading,
  onClick,
  onDownload,
  onDelete,
}: {
  name: string;
  isLoading?: boolean;
  onClick: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        opacity: !isLoading ? 1 : 0.5,
        pointerEvents: !isLoading ? "initial" : "none",
        width: "100%",
        height: "100%",
        borderRadius: "0.5rem",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "flex-start",
        // cursor: "pointer",
        padding: "1rem",
        boxSizing: "border-box",
        backgroundColor: "#3a3a3a",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        position: "relative",
      }}
    >
      <div style={{ marginRight: "0.5rem" }}>
        <FaFile size="2rem" />
      </div>
      <span style={{ fontSize: "1rem", fontWeight: "500" }}>{name}</span>
      <div
        style={{
          position: "absolute",
          top: "0.5rem",
          right: "0.5rem",
          cursor: "pointer",
          padding: "0.5rem 0.5rem",
        }}
        onClick={() => onDownload && onDownload()}
      >
        <FaDownload />
      </div>
      <div
        style={{
          position: "absolute",
          left: "0.5rem",
          top: "0.5rem",
          cursor: "pointer",
          padding: "0.5rem 0.5rem",
        }}
        onClick={() => onDelete && onDelete()}
      >
        <FaTrash />
      </div>
    </div>
  );
}
