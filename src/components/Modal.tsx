import {
  DialogContent as ReachDialogContent,
  DialogOverlay as ReachDialogOverlay,
} from "@reach/dialog";
import React from "react";

interface ModalProps {
  children: React.ReactNode;
  a11yLabel: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Modal({ children, a11yLabel, isOpen, onClose }: ModalProps) {
  return (
    <ReachDialogOverlay
      className="modal-overlay"
      isOpen={isOpen}
      onDismiss={onClose}
      allowPinchZoom
    >
      <ReachDialogContent className="modal-content" aria-label={a11yLabel}>
        {children}
      </ReachDialogContent>
    </ReachDialogOverlay>
  );
}
