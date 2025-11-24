import React from 'react';
export type Role = 'admin' | 'teacher' | 'parent' | 'learningPartner' | 'kid';
interface RoleGateProps {
    allowedRoles: Role[];
    loginPath?: string;
    unauthorizedPath?: string;
}
declare const RoleGate: React.FC<RoleGateProps>;
export default RoleGate;
