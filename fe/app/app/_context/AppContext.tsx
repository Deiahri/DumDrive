import { GetDirResponse } from '@shared/types/s3/S3Types';
import React, { createContext, useState, ReactNode } from 'react';

interface DirDataCache {
  [k: string]: GetDirResponse
};

interface AppContextType {
  DirData: GetDirResponse | "loading" | "failed";
  setDirData: React.Dispatch<React.SetStateAction<any>>;
  DirDataCache: DirDataCache;
  setDirDataCache: React.Dispatch<React.SetStateAction<DirDataCache>>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [DirData, setDirData] = useState<AppContextType['DirData']>("loading");
  const [DirDataCache, setDirDataCache] = useState<DirDataCache>({});
  

  return (
    <AppContext.Provider value={{ DirData, setDirData, DirDataCache, setDirDataCache }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};