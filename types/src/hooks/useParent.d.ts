import { ParentChildSummary, ParentSession, ParentInvoice, ParentPayment } from '../types/Parent';
export declare const useParentChildren: (parentId: string) => import("@tanstack/react-query").UseQueryResult<ParentChildSummary[], Error>;
export declare const useParentSessions: (parentId: string) => import("@tanstack/react-query").UseQueryResult<ParentSession[], Error>;
export declare const useParentInvoices: (parentId: string) => import("@tanstack/react-query").UseQueryResult<ParentInvoice[], Error>;
export declare const useParentPayments: (parentId: string) => import("@tanstack/react-query").UseQueryResult<ParentPayment[], Error>;
