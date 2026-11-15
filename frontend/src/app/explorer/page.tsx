import type { Metadata } from "next";
import type { AnalogDataset } from "@/types/analog";
import { MissionControlApp } from "@/components/MissionControlApp";
import analogsData from "../../../public/data/analogs.json";

export const metadata: Metadata = {
  title: "ATLANIA // Observatorio Planetario & Explorador de Análogos",
  description:
    "Observatorio planetario y atlas interactivo 3D para contemplar la Tierra, explorar territorios análogos extraordinarios, telemetría de satélites ópticos/SAR/térmicos y comparación planetaria con la Luna y Marte.",
};

export default function ExplorerPage() {
  const dataset = analogsData as unknown as AnalogDataset;
  return <MissionControlApp dataset={dataset} />;
}
