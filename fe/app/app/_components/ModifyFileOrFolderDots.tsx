"use client";
import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useAppContext } from "../_context/AppContext";

interface option {
  text: string;
  onClick: Function;
}

export default function ModifyFileOrFolderDots({
  style,
  openLeftOrRight,
  options,
  file,
  path,
}: {
  style: React.CSSProperties;
  openLeftOrRight: "left" | "right";
  options?: option[];
  file: string | null;
  path: string;
}) {
  const { setAccessModalPathAndFile } = useAppContext();
  const [open, setOpen] = useState(false);

  if (!options) {
    options = [
      {
        text: "Share",
        onClick: () => {
          setAccessModalPathAndFile({
            file: file,
            path: path,
          });
        },
      },
      {
        text: "Delete",
        onClick: () => {},
      },
    ];
  }

  return (
    <>
      <div style={{ position: "relative" }}>
        <BsThreeDotsVertical
          onClick={() => setOpen(!open)}
          style={{ cursor: "pointer", ...style }}
        />
        {open && (
          <div
            style={{
              position: "absolute",
              left: openLeftOrRight != "left" ? 0 : undefined,
              right: openLeftOrRight != "right" ? 0 : undefined,
              top: "2rem",
              zIndex: 10,
              backgroundColor: "red",
              // padding: "0.5rem",
              paddingRight: "2rem",
              borderRadius: "0.25rem",
              userSelect: "none",
            }}
          >
            {options.map((option, i) => {
              return (
                <div
                  style={{
                    padding: "0.5rem 2rem 0.5rem 1rem",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    option.onClick();
                    setOpen(false);
                  }}
                  key={i}
                >
                  {option.text}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
