"use client";

import React, { useState } from "react";
import { useAppContext } from "../_context/AppContext";
import useCustomSearchParams from "@/app/_hooks/useCustomSearchParams";
import { Share } from "@shared/types/share/ShareType";
import useAuthedFetch from "@/app/_hooks/useAuthedFetch";
import { env_vars } from "@/app/_tools/env_vars";
import { FaTrash } from "react-icons/fa6";

const ShareModal: React.FC = () => {
  const AuthedFetch = useAuthedFetch();

  const {
    accessModalPathAndFile,
    setAccessModalPathAndFile,
    // setDirShareCache,
    DirShareCache,
  } = useAppContext();
  const devs = [
    "Alice",
    "Bob",
    "Charlie",
    "Diana",
    "Eve",
    "Frank",
    "Grace",
    "Hank",
    "Ivy",
    "Jack",
  ];

  const { getParams } = useCustomSearchParams();
  const bucket = getParams("b");

  const [userEmailInput, setUserEmailInput] = useState("");
  const [userEmailsToAdd, setUserEmailsToAdd] = useState<string[]>([]);
  const handleAddUser = async () => {
    setUserEmailsToAdd([...userEmailsToAdd, userEmailInput]);
    setUserEmailInput("");
  };

  if (!bucket) return;

  if (!accessModalPathAndFile) return;

  const handleClose = () => {
    setAccessModalPathAndFile(undefined);
  };

  const possibleShares = DirShareCache?.[bucket]?.[accessModalPathAndFile.path];
  let definiteShare: Share | undefined = undefined;
  for (const share of possibleShares) {
    if (accessModalPathAndFile.file == share.file) {
      definiteShare = share;
      break;
    }
  }

  const handleSaveAddedUsers = async () => {
    try {
      await AuthedFetch(`${env_vars.BACKEND_URL}/Share`, {
        method: "POST",
      });
    } catch {}
  };

  const { path, file } = accessModalPathAndFile;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#0008",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: "40rem",
          minHeight: "30rem",
          maxHeight: "60rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "black",
          }}
        >
          Modify Access
        </span>
        <span style={{ color: "#555" }}>
          {(path || "") + "/" + (file ? file + "/" : "")}
        </span>
        <form
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
          }}
          onSubmit={(e) => {
            e.preventDefault();
            handleAddUser();
          }}
        >
          <input
            style={{
              border: "1px solid #0004",
              backgroundColor: "#0002",
              padding: "0.5rem 2rem 0.5rem 1rem",
              borderRadius: "0.25rem",
              color: "black",
              width: "100%",
            }}
            onChange={(e) => setUserEmailInput(e.target.value)}
            value={userEmailInput}
            type="email"
            placeholder="user@email.com"
          />
          <div
            style={{
              backgroundColor: "blue",
              color: "white",
              borderRadius: "0.5rem",
              padding: "0.5rem 1rem",
            }}
          >
            Send
          </div>
        </form>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginBottom: "1rem",
            color: "black",
          }}
        >
          {userEmailsToAdd.map((email, index) => {
            return (
              <div
                key={index}
                style={{
                  padding: "0.5rem",
                  backgroundColor: "#98da88",
                  borderRadius: "4px",
                  textAlign: "center",
                  color: "black",
                  position: "relative",
                }}
              >
                <span>{email}</span>
                <FaTrash
                  style={{
                    position: "absolute",
                    right: "1rem",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setUserEmailsToAdd((emails) =>
                      emails.filter((e) => e != email),
                    )
                  }
                />
              </div>
            );
          })}
          {definiteShare?.users.map((user, index) => (
            <div
              key={index}
              style={{
                padding: "0.5rem",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
                textAlign: "center",
              }}
            >
              {user}
            </div>
          ))}
          {!definiteShare?.users && userEmailsToAdd.length == 0 && (
            <span>No one yet...</span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#ccc",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
