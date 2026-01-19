import useAuthedFetch from "@/app/_hooks/useAuthedFetch";
import useCustomSearchParams from "@/app/_hooks/useCustomSearchParams";
import { env_vars } from "@/app/_tools/env_vars";
import React from "react";
import { FaPlus } from "react-icons/fa";
import { useAppContext } from "../_context/AppContext";
import { GetDirResponse } from "@shared/types/s3/S3Types";
import { checkGetDirResponse } from "@shared/types/s3/S3Check";
import { useClerk } from "@clerk/clerk-react";

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = () => {
  const { getParams } = useCustomSearchParams();
  const { setDirData, DirData } = useAppContext();
  const path = getParams("p");
  const user = getParams("u");
  const bucket = getParams("b");
  const AuthedFetch = useAuthedFetch();

  const onAddFileClick = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;

    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files) return;

      // Update the DirData state with the new file
      const newDirData: GetDirResponse = { ...(DirData as GetDirResponse) };
      if (!newDirData.files) {
        newDirData.files = [];
      }
      const nameSet = new Set<string>();
      for (const fileToUpload of Array.from(files)) {
        nameSet.add(fileToUpload.name);
        newDirData.files.push({
          name: fileToUpload.name,
          size: fileToUpload.size,
          lastModified: new Date().toDateString(),
          isLoading: true,
        });
      }
      setDirData(newDirData);

      for (const file of Array.from(files)) {
        try {
          // Fetch the upload link for the file
          const res = await AuthedFetch(
            `${env_vars.BACKEND_URL}/GetUploadLink`,
            {
              method: "POST",
              body: JSON.stringify({
                user,
                path: (path || ""),
                file: file.name,
                contentType: file.type,
                bucket
              }),
            },
          );

          const { url } = await res.json();

          // Upload the file to the provided link
          const uploadRes = await fetch(url, {
            method: "PUT",
            body: file,
          });

          if (!uploadRes.ok) {
            console.error(`Failed to upload file: ${file.name}`);
            continue;
          }

          console.log(`File uploaded successfully: ${file.name}`);
          setDirData((dirData: GetDirResponse) => {
            return {
              ...dirData,
              files: dirData.files.map((currentFile) =>
                !nameSet.has(currentFile.name)
                  ? currentFile
                  : { ...currentFile, isLoading: false },
              ),
            };
          });
        } catch (error) {
          setDirData((dirData: GetDirResponse) => {
            return {
              ...dirData,
              files: dirData.files.filter(
                (currentFile) => currentFile.name != file.name,
              ),
            };
          });
          console.error(`Error uploading file: ${file.name}`, error);
        }
      }
    };

    input.click();
  };

  const onAddFolderClick = async () => {
    if (DirData == "failed" || DirData == "loading") {
      alert(DirData);
      // not possible to add when failed or loading
      return;
    }
    const folderName = prompt("Folder name?");
    if (!folderName) return alert("No folder name provided");

    const newFolderName = (path || "") + folderName + "/";

    const preemptiveData: GetDirResponse = { ...DirData };
    preemptiveData.folders.push({ name: newFolderName, isLoading: true });
    setDirData(preemptiveData);

    try {
      const res = await (
        await AuthedFetch(`${env_vars.BACKEND_URL}/CreateFolder`, {
          method: "POST",
          body: JSON.stringify({
            path: path,
            folderName: folderName,
            bucket
          }),
        })
      ).json();

      if (res.error) throw new Error(res.error);

      const newDirData: GetDirResponse = {
        ...preemptiveData,
        folders: preemptiveData.folders.map((folder) =>
          folder.name == newFolderName
            ? { ...folder, isLoading: false }
            : folder,
        ),
      };
      setDirData(newDirData);
      console.log("set");
    } catch (e) {
      const oldDirData = { ...DirData };
      oldDirData.folders = oldDirData.folders.filter(
        (file) => file.name != newFolderName,
      );
      setDirData(oldDirData);
      console.log("error", e);
    }
    // Add your logic for adding a folder here
  };

  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
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
      <div
        style={{
          height: "100%",
          display: "flex",
          width: "100%",
          flexDirection: "column-reverse",
        }}
      >
        <div
          onClick={() => handleLogout()}
          style={{
            width: "100%",
            padding: "1rem",
            textAlign: "center",
            backgroundColor: "#622",
            borderRadius: "1rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Logout
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
