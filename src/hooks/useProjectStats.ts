import { useState, useEffect } from "react";

export function useProjectStats() {
  const [stats, setStats] = useState({ wordCount: 0, streak: 0 });
  
  useEffect(() => {
    // Placeholder logic — can connect to autosave logs or writing history later
    setStats({ wordCount: 0, streak: 0 });
  }, []);

  return stats;
}
