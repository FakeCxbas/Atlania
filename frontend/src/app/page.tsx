import type { AnalogDataset } from "@/types/analog";
import { MissionControlApp } from "@/components/MissionControlApp";
import analogsData from "../../public/data/analogs.json";

export default function HomePage() {
  const dataset = analogsData as unknown as AnalogDataset;
  return <MissionControlApp dataset={dataset} />;
}
