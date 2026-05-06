import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type AppMessageContextValue = {
  message: string | null;
  showMessage: (message: string) => void;
};

const AppMessageContext = createContext<AppMessageContextValue | null>(null);

export const AppMessageProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = useCallback((nextMessage: string) => {
    setMessage(nextMessage);

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    dismissTimerRef.current = setTimeout(() => {
      setMessage(null);
      dismissTimerRef.current = null;
    }, 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  return (
    <AppMessageContext.Provider value={{ message, showMessage }}>
      {children}
    </AppMessageContext.Provider>
  );
};

export const useAppMessage = () => {
  const context = useContext(AppMessageContext);

  if (!context) {
    throw new Error("useAppMessage must be used inside AppMessageProvider");
  }

  return context;
};
