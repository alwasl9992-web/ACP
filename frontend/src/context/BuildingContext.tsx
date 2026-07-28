import { createContext, useContext, useState } from "react";
import type { Building } from "../models/Building";

interface BuildingContextType {
  selectedBuilding: Building | null;
  setSelectedBuilding: (building: Building | null) => void;
}

const BuildingContext = createContext<BuildingContextType>({
  selectedBuilding: null,
  setSelectedBuilding: () => {},
});

export const BuildingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedBuilding, setSelectedBuilding] =
    useState<Building | null>(null);

  return (
    <BuildingContext.Provider
      value={{
        selectedBuilding,
        setSelectedBuilding,
      }}
    >
      {children}
    </BuildingContext.Provider>
  );
};

export const useBuilding = () => useContext(BuildingContext);