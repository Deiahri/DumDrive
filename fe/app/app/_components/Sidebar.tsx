import useAuthedFetch from "@/app/_hooks/useAuthedFetch";
import useCustomSearchParams from "@/app/_hooks/useCustomSearchParams";
import { env_vars } from "@/app/_tools/env_vars";
import React from "react";
import { FaPlus } from "react-icons/fa";
import { useAppContext } from "../_context/AppContext";
import { GetDirResponse } from "@shared/types/s3/S3Types";

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = () => {
  const { getParams } = useCustomSearchParams();
  const { setDirData, DirData } = useAppContext();
  const path = getParams("p");
  const AuthedFetch = useAuthedFetch();

  const onAddFileClick = () => {
    // Add your logic for adding a file here
  };

  const onAddFolderClick = () => {
    if (DirData == "failed" || DirData == "loading") {
      alert(DirData);
      // not possible to add when failed or loading
      return;
    }
    const folderName = prompt("Folder name?");
    if (!folderName) return alert("No folder name provided");
    const newFolderName = (path || '') + folderName + "/";
    try {
      AuthedFetch(`${env_vars.BACKEND_URL}/CreateFolder`, {
        method: "POST",
        body: JSON.stringify({
          path: newFolderName,
        }),
      });

      const newDirData: GetDirResponse = DirData;
      newDirData.folders.push({ name: newFolderName });
      setDirData(newDirData);
    } catch {}
    // Add your logic for adding a folder here
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      <div
        onClick={onAddFolderClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: "0.5rem",
          backgroundColor: "#333",
          gap: "0.5rem",
        }}
      >
        <FaPlus />
        <span>Add Folder</span>
      </div>
      <div
        onClick={onAddFileClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: "0.5rem",
          backgroundColor: "#333",
          gap: "0.5rem",
        }}
      >
        <FaPlus />
        <span>Add File</span>
      </div>
    </div>
  );
};

export default Sidebar;
