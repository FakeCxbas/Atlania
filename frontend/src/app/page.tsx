import type { Metadata } from "next";
import type { AnalogDataset } from "@/types/analog";
import { MissionBriefingLanding } from "@/components/MissionBriefingLanding";
import analogsData from "../../public/data/analogs.json";

export const metadata: Metadata = {
  title: "ATLANIA — Observatorio Planetario & Atlas de Análogos // NASA Space Apps Challenge",
  description:
    "Existe una belleza particular en los lugares que no podemos encontrar. ATLANIA es un atlas dedicado a explorar los territorios extraordinarios de la Tierra y descubrir sus semejanzas con los paisajes de la Luna y Marte.",
};

export default function HomePage() {
  const dataset = analogsData as unknown as AnalogDataset;
  return <MissionBriefingLanding dataset={dataset} />;
}
