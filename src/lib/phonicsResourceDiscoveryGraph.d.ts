import type { PhonicsProgrammaticPilotGroup, PhonicsProgrammaticPilotPage } from './phonicsProgrammaticPilot.js';

export type PhonicsResourceDiscoveryRelation =
  | 'hub-child'
  | 'parent-hub'
  | 'cluster-sibling'
  | 'adjacent-pattern';

export interface PhonicsResourceDiscoveryCluster {
  readonly id: string;
  readonly anchorId: string;
  readonly label: string;
  readonly description: string;
  readonly group: PhonicsProgrammaticPilotGroup;
  readonly href: `/resources/phonics#${string}`;
  readonly pages: readonly PhonicsProgrammaticPilotPage[];
}

export interface PhonicsResourceDiscoveryEdge {
  readonly from: string;
  readonly to: string;
  readonly relation: PhonicsResourceDiscoveryRelation;
}

export const PHONICS_RESOURCE_DISCOVERY_REVISION: string;
export const PHONICS_RESOURCE_HUB_PATH: '/resources/phonics';
export const PHONICS_RESOURCE_DISCOVERY_CLUSTERS: readonly PhonicsResourceDiscoveryCluster[];
export const PHONICS_RESOURCE_DISCOVERY_EDGES: readonly PhonicsResourceDiscoveryEdge[];

export function getPhonicsResourceDiscoveryClusterById(id: string): PhonicsResourceDiscoveryCluster | null;
export function getPhonicsResourceDiscoveryClusterForPath(path: string): PhonicsResourceDiscoveryCluster | null;
export function getRelatedPhonicsResourcePages(path: string, limit?: number): readonly PhonicsProgrammaticPilotPage[];
export function getPhonicsResourceDiscoveryTargets(from: string): readonly string[];
export function getPhonicsResourceReachablePaths(start?: string): readonly string[];
