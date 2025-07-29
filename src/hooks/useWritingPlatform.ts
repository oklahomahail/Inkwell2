import { useState, useEffect } from 'react';

export const useWritingPlatform = () => {
  const [data, setData] = useState<string>('Loading project...');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setData('Writing platform ready!');
    }, 1000);
  }, []);

  return {
    data,
    // Add more state or logic as your app grows
  };
};
