import { GetDirResponse } from '@shared/types/s3/S3Types';
import React, { createContext, useState, ReactNode } from 'react';

interface AppContextType {
  DirData: GetDirResponse | "loading" | "failed";
  setDirData: React.Dispatch<React.SetStateAction<any>>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [DirData, setDirData] = useState<AppContextType['DirData']>("loading");

  return (
    <AppContext.Provider value={{ DirData, setDirData }}>
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