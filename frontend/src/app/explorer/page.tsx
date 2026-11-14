import type { Metadata } from "next";
import type { AnalogDataset } from "@/types/analog";
import { MissionControlApp } from "@/components/MissionControlApp";
import analogsData from "../../../public/data/analogs.json";

export const metadata: Metadata = {
  title: "TERR-ANALOG // Explorador Geoespacial y Telemetría ASI",
  description:
    "Consola interactiva de exploración geoespacial 3D, comparación Tierra vs. Luna/Marte, sondeo satelital NASA POWER + Copernicus DEM y exportación QGIS.",
};

export default function ExplorerPage() {
  const dataset = analogsData as unknown as AnalogDataset;
  return <MissionControlApp dataset={dataset} />;
}
