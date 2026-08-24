import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AssetsList from "@/pages/dashboard/files/assets-list";
import React from "react";

type SelectAssetsModalProps = {
  onClose: () => void;
};

const SelectAssetsModal: React.FC<SelectAssetsModalProps> = ({ onClose }) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-1rem)] max-w-4xl flex-col overflow-hidden p-4">
        <DialogHeader className="shrink-0 pr-6">
          <DialogTitle>Select PDFs from Files</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <AssetsList enableSelect />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectAssetsModal;
