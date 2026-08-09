export type SchoolStatus =
  | 'active'
  | 'paused'
  | 'archived';

export interface SchoolContact {
  name: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
}

export interface SchoolLocation {
  city: string | null;
  state: string | null;
  country: string;
}

export interface SchoolRecord {
  id: string;
  schemaVersion: number;
  schoolCode: string;
  name: string;
  nameSearch: string;
  status: SchoolStatus;
  contact: SchoolContact;
  location: SchoolLocation;
  learningPartnerId: string | null;
  learningPartnerName: string | null;
  learningPartnerEmail: string | null;
  learningPartnerAssignedAt?: unknown;
  createdAt?: unknown;
  createdBy?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface SchoolUserAccess {
  userId: string;
  role: 'schoolAdmin';
  schoolIds: string[];
  primarySchoolId: string | null;
  status: 'active' | 'unassigned';
  createdAt?: unknown;
  createdBy?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface SchoolDirectoryUser {
  id: string;
  name: string;
  email: string;
  role: 'learningPartner' | 'schoolAdmin';
  status: string;
}

export interface SchoolFormFields {
  name: string;
  status: SchoolStatus;
  contactName: string;
  contactDesignation: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  state: string;
  country: string;
}

export interface CreateSchoolInput extends SchoolFormFields {
  learningPartnerId?: string | null;
  schoolAdminUserIds?: string[];
}

export interface UpdateSchoolInput extends SchoolFormFields {
  schoolId: string;
}

export interface SchoolPortalAccess {
  access: SchoolUserAccess | null;
  schools: SchoolRecord[];
  primarySchool: SchoolRecord | null;
}
