import type { AnalogDataset } from "@/types/analog";
import { MissionBriefingLanding } from "@/components/MissionBriefingLanding";
import analogsData from "../../../public/data/analogs.json";

export default function PresentacionPage() {
  const dataset = analogsData as unknown as AnalogDataset;
  return <MissionBriefingLanding dataset={dataset} />;
}
