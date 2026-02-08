import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TimeContextType {
  getCurrentTime: () => Date;
  setSimulatedTime: (date: Date | null) => void;
  simulatedTime: Date | null;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export function TimeProvider({ children }: { children: ReactNode }) {
  // Read initial offset from localStorage and calculate simulatedTime
  const [simulatedOffset, setSimulatedOffset] = useState<number>(() => {
    const stored = localStorage.getItem('simulatedTimeOffset');
    return stored ? parseInt(stored, 10) : 0;
  });

  const [simulatedTime, setSimulatedTimeState] = useState<Date | null>(() => {
    const storedOffset = localStorage.getItem('simulatedTimeOffset');
    if (storedOffset) {
      const offset = parseInt(storedOffset, 10);
      return new Date(new Date().getTime() + offset);
    }
    return null;
  });

  // Sync with localStorage changes (from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'simulatedTimeOffset') {
        const newOffset = e.newValue ? parseInt(e.newValue, 10) : 0;
        setSimulatedOffset(newOffset);
        if (newOffset !== 0) {
          setSimulatedTimeState(new Date(new Date().getTime() + newOffset));
        } else {
          setSimulatedTimeState(null);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Wrapper to update both state and localStorage
  const setSimulatedTime = (date: Date | null) => {
    if (date) {
      const offset = date.getTime() - new Date().getTime();
      setSimulatedOffset(offset);
      setSimulatedTimeState(date);
      localStorage.setItem('simulatedTimeOffset', offset.toString());
    } else {
      setSimulatedOffset(0);
      setSimulatedTimeState(null);
      localStorage.removeItem('simulatedTimeOffset');
    }
  };

  const getCurrentTime = () => {
    if (simulatedOffset !== 0) {
      // Return real time + offset, so simulated time keeps running
      return new Date(new Date().getTime() + simulatedOffset);
    }
    return new Date();
  };

  return (
    <TimeContext.Provider value={{ getCurrentTime, setSimulatedTime, simulatedTime }}>
      {children}
    </TimeContext.Provider>
  );
}

export function useTime() {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
}