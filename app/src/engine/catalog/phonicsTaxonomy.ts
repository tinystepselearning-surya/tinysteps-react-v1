import type { SkillNode } from "../types";

export const phonicsSAT: SkillNode[] = [
  { id: "phonics.sat.s", area: "phonics", phase: 2, label: "/s/", confusionWith: ["sh", "z"] },
  { id: "phonics.sat.a", area: "phonics", phase: 2, label: "/a/", confusionWith: ["ɒ", "ʌ"] },
  { id: "phonics.sat.t", area: "phonics", phase: 2, label: "/t/", confusionWith: ["d"] },
  // add digraph starter nodes as phase 3
  { id: "phonics.digraph.sh", area: "phonics", phase: 3, label: "sh", confusionWith: ["s", "ch"] },
  { id: "phonics.digraph.ch", area: "phonics", phase: 3, label: "ch", confusionWith: ["sh", "j"] },
  { id: "phonics.digraph.th", area: "phonics", phase: 3, label: "th", confusionWith: ["t", "f"] },
];
