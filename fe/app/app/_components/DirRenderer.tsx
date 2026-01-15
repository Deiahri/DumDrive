"use client";

import useAuthedFetch from "@/app/_hooks/useAuthedFetch";
import useCustomSearchParams from "@/app/_hooks/useCustomSearchParams";
import { env_vars } from "@/app/_tools/env_vars";
import { checkGetDirResponse } from "@shared/types/s3/S3Check";
import { GetDirResponse } from "@shared/types/s3/S3Types";
import { useEffect, useState } from "react";
import { FaFile } from "react-icons/fa";
import { FaFolder } from "react-icons/fa6";
import { useAppContext } from "../_context/AppContext";

export default function DirRenderer({
  path,
  user,
}: {
  path?: string;
  user?: string;
}) {
  const { updateParams } = useCustomSearchParams();
  const AuthedFetch = useAuthedFetch();
  const { DirData, setDirData } = useAppContext();

  const handleFolderClick = (folder: string) => {
    updateParams({ p: folder }, false);
  };

  useEffect(() => {
    const makeFetch = async () => {
      setDirData("loading");
      try {
        console.log(`${env_vars.BACKEND_URL}/GetDir`);
        const res = await (
          await AuthedFetch(`${env_vars.BACKEND_URL}/GetDir`, {
            method: "POST",
            body: JSON.stringify({
              user,
              path: path || "",
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
        setDirData(res);
      } catch (e) {
        console.error((e as Error).message);
        setDirData("failed");
      }
    };
    makeFetch();
  }, [path, user]);

  if (DirData == "failed" || DirData == "loading") return null;

  const isEmpty = (DirData.files.length == 0 || DirData.files.length == 1 && DirData.files[0].name == path) && DirData.folders.length == 0;
  if (isEmpty) {
    return <span>Nothing in here mate.</span>
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
              onClick={() => handleFolderClick(folder.name)}
            />
          );
        })}
      </div>

      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
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
              onClick={() => console.log(`Clicked on File ${index + 1}`)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Folder({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "0.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        cursor: "pointer",
        padding: "1rem",
        boxSizing: "border-box",
        backgroundColor: "#3a3a3a",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ marginRight: "0.5rem" }}>
        <FaFolder />
      </div>
      <span style={{ fontSize: "1rem", fontWeight: "500" }}>{name}</span>
    </div>
  );
}

function File({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
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
      }}
    >
      <div style={{ marginRight: "0.5rem" }}>
        <FaFile size="2rem" />
      </div>
      <span style={{ fontSize: "1rem", fontWeight: "500" }}>{name}</span>
    </div>
  );
}
