import { ParentInvoice, ParentPayment } from '../../../types/Parent';
export declare const useInvoices: (parentId?: string) => import("@tanstack/react-query").UseQueryResult<ParentInvoice[], Error>;
export declare const usePaymentHistory: (parentId?: string) => import("@tanstack/react-query").UseQueryResult<ParentPayment[], Error>;
