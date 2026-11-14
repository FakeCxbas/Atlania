"use client";

import { useRouter } from "next/navigation";
import type { AnalogDataset } from "@/types/analog";
import { MissionPresentation } from "@/components/MissionPresentation";
import { translateSite, translateTarget } from "@/lib/spanishTranslations";
import analogsData from "../../../public/data/analogs.json";

export default function PresentacionPage() {
  const router = useRouter();
  const dataset = analogsData as unknown as AnalogDataset;

  const translatedSites = dataset.sites.map((s) => translateSite(s));
  const translatedReferences: Record<string, ReturnType<typeof translateTarget>> = {};
  for (const [k, v] of Object.entries(dataset.references)) {
    translatedReferences[k] = translateTarget(v);
  }

  return (
    <MissionPresentation
      dataset={dataset}
      sites={translatedSites}
      references={translatedReferences}
      onSelectSiteAndExplore={() => router.push("/")}
      onClose={() => router.push("/")}
    />
  );
}
