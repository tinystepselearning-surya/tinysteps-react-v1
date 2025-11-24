import type { Kid, NewKidInput } from '../models/kid';
export declare function createKid(input: NewKidInput): Promise<string>;
export declare function getKidById(id: string): Promise<Kid | null>;
export declare function updateKid(id: string, changes: Partial<Kid>): Promise<void>;
export declare function listKidsByParent(parentId: string): Promise<Kid[]>;
export declare function listAllKids(): Promise<Kid[]>;
export declare function deleteKid(id: string): Promise<void>;
