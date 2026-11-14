import type { Metadata } from "next";
import type { AnalogDataset } from "@/types/analog";
import { MissionBriefingLanding } from "@/components/MissionBriefingLanding";
import analogsData from "../../public/data/analogs.json";

export const metadata: Metadata = {
  title: "TERR-ANALOG — Mission Briefing // NASA Space Apps Challenge 2026",
  description:
    "La Tierra como laboratorio para explorar otros mundos. Compara datos científicos de NASA POWER, Copernicus DEM y NASA PDS para descubrir análogos terrestres de la Luna y Marte.",
};

export default function HomePage() {
  const dataset = analogsData as unknown as AnalogDataset;
  return <MissionBriefingLanding dataset={dataset} />;
}
