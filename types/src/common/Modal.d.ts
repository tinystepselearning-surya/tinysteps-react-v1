import React from 'react';
type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
};
declare const Modal: React.FC<ModalProps>;
export default Modal;
