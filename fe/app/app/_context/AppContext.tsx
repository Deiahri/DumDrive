import useAuthedFetch from "@/app/_hooks/useAuthedFetch";
import { env_vars } from "@/app/_tools/env_vars";
import { GetDirResponse } from "@shared/types/s3/S3Types";
import { Share } from "@shared/types/share/ShareType";
import { UserObj } from "@shared/types/user/UserType";
import { checkUserObj } from "@shared/types/user/UserCheck";
import React, { createContext, useState, ReactNode, useEffect } from "react";
import useCustomSearchParams from "@/app/_hooks/useCustomSearchParams";
import { getBucketIDFromUserID } from '@shared/types/s3/S3Funcs';

interface DirDataCache {
  [bucket: string]: {
    [path: string]: GetDirResponse;
  };
}

interface DirShareCache {
  [bucket: string]: {
    [path: string]: Share[];
  }
}

interface AccessModalPathAndFile {
  path: string,
  file: string | null
};

interface AppContextType {
  DirData: GetDirResponse | "loading" | "failed";
  setDirData: React.Dispatch<React.SetStateAction<any>>;
  DirDataCache: DirDataCache;
  setDirDataCache: React.Dispatch<React.SetStateAction<DirDataCache>>;
  DirShareCache: DirShareCache;
  setDirShareCache: React.Dispatch<React.SetStateAction<DirShareCache>>;
  userObj: UserObj | undefined;
  accessModalPathAndFile: AccessModalPathAndFile | undefined;
  setAccessModalPathAndFile: React.Dispatch<React.SetStateAction<AccessModalPathAndFile | undefined>>;
}


export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [DirData, setDirData] = useState<AppContextType["DirData"]>("loading");
  const [DirDataCache, setDirDataCache] = useState<DirDataCache>({});
  const [DirShareCache, setDirShareCache] = useState<DirShareCache>({});
  const [userObj, setUserObj] = useState<UserObj | undefined>(undefined);
  const AuthedFetch = useAuthedFetch();
  const { getParams, updateParams } = useCustomSearchParams();
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessModalPathAndFile, setAccessModalPathAndFile] = useState<AccessModalPathAndFile | undefined>(undefined);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await(await AuthedFetch(
          `${env_vars.BACKEND_URL}/getUsersInfo`,
          {
            method: "POST",
            // can send without body, will get our own data
          },
        )).json();
        const selfData = Object.values(userData)[0]; // should only return one object; our data.
        checkUserObj(selfData);
        setUserObj(selfData);
        // console.log('got user', userData);
      } catch (e) {
        console.log("issue fetching user", e);
      }
    };
    fetchUser();
  }, []);


  const bucket = getParams('b');
  useEffect(() => {
    if (!userObj || !userObj.id) return;
    if (!bucket) {
      const userBucketID = getBucketIDFromUserID(userObj.id!);
      updateParams({
        b: userBucketID
      }, false);
    }
  }, [bucket, userObj]);



  return (
    <AppContext.Provider
      value={{
        DirData,
        setDirData,
        DirDataCache,
        setDirDataCache,
        DirShareCache,
        setDirShareCache,
        userObj,
        accessModalPathAndFile,
        setAccessModalPathAndFile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
