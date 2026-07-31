import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface NavigationContextType {
  page: string;
  navigate: (page: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [page, setPage] = useState("dashboard");

  const navigate = (page: string) => {
    setPage(page);
  };

  return (
    <NavigationContext.Provider
      value={{
        page,
        navigate,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error(
      "useNavigation must be used inside NavigationProvider"
    );
  }

  return context;
}