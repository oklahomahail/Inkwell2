import React, { createContext, useContext, useState, ReactNode } from "react";

interface ClaudeContextType {
  queryClaude: (prompt: string) => Promise<string>;
}

const ClaudeContext = createContext<ClaudeContextType | undefined>(undefined);

export const ClaudeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const queryClaude = async (prompt: string): Promise<string> => {
    setLoading(true);
    try {
      // Placeholder AI integration – replace with real API
      await new Promise(res => setTimeout(res, 500)); 
      return `Claude mock response to: "${prompt}"`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClaudeContext.Provider value={{ queryClaude }}>
      {children}
    </ClaudeContext.Provider>
  );
};

export function useClaude() {
  const ctx = useContext(ClaudeContext);
  if (!ctx) throw new Error("useClaude must be used within ClaudeProvider");
  return ctx;
}
