"use client";
import { FaChevronLeft } from "react-icons/fa6";
import useCustomSearchParams from "../_hooks/useCustomSearchParams";
import DirRenderer from "./_components/DirRenderer";
import Sidebar from "./_components/Sidebar";
import { AppProvider } from "./_context/AppContext";
import React from "react";

export default function AppController() {
  // const b = useCustomSearchParams();
  const { getParams, updateParams } = useCustomSearchParams();

  const userBucket = getParams("u");
  const path = getParams("p");

  const handleBreadcrumbTraversal = (newPath: string) => {
    if (newPath == path) return;
    updateParams(
      {
        p: newPath,
      },
      false
    );
  };

  return (
    <AppProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100%",
        }}
      >
        <div
          style={{
            height: "5rem",
            width: "100%",
            borderBottom: "1px solid #ccc",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <div
            style={{
              width: "20rem",
              borderRight: "1px solid #ccc",
              height: "100%",
              padding: "1rem",
              boxSizing: "border-box",
            }}
          >
            <div style={{ border: "1px solid #ccc", height: "100%" }}>
              {/* Logo */}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              borderRight: "1px solid #ccc",
              height: "100%",
              padding: "1rem",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                border: "1px solid #ccc",
                height: "100%",
                width: "100%",
              }}
            >
              {/* Logo */}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, flexDirection: "row" }}>
          <div
            style={{
              width: "20rem",
              height: "100%",
              borderRight: "1px solid #ccc",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            <Sidebar />
          </div>
          <div
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "start",
              padding: "1.5rem",
              boxSizing: "border-box",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <Breadcrumbs
              path={path || ""}
              onClick={handleBreadcrumbTraversal}
            />
            <DirRenderer path={path} user={userBucket} />
          </div>
        </div>
      </div>
    </AppProvider>
  );
}

function Breadcrumbs({
  path,
  onClick,
}: {
  path: string;
  onClick: (newPath: string) => void;
}) {
  const pathSegments = path.split("/").filter(Boolean);

  const handleClick = (index: number) => {
    let path = "";
    for (let i = 0; i <= index; i++) {
      path += pathSegments[i] + "/";
    }
    onClick(path);
  };

  if (pathSegments.length < 1) {
    return <span style={{ fontSize: "2rem" }}>My Drive</span>;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {/* <FaChevronLeft style={{cursor: 'pointer'}} onClick={() => handleClick(-1)} /> */}
      <span style={{ fontSize: "1.5rem", cursor: 'pointer' }} onClick={() => handleClick(-1)}>
        /
      </span>
      {pathSegments.map((segment, index) => {
        // const segmentPath = pathSegments.slice(0, index + 1).join("/");
        return (
          <React.Fragment key={index}>
            <span
              style={{ cursor: "pointer", fontSize: "2rem" }}
              onClick={() => handleClick(index)}
            >
              {segment}
            </span>
            {index < pathSegments.length - 1 && (
              <span style={{ fontSize: "1.5rem" }}>/</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
