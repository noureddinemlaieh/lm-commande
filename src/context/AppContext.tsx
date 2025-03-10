"use client";

import React, { createContext, useContext } from 'react';
import { message as antdMessage } from 'antd';

interface AppContextProps {
  message: typeof antdMessage;
}

const AppContext = createContext<AppContextProps>({
  message: antdMessage,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppContext.Provider value={{ message: antdMessage }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext); 