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
      <DialogContent className='min-w-[90%]'>
        <DialogHeader>
          <DialogTitle>Select PDFs</DialogTitle>
        </DialogHeader>
        <AssetsList />
      </DialogContent>
    </Dialog>
  );
};

export default SelectAssetsModal;
