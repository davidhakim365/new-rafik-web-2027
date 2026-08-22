import { PdfOpenButton } from "@/components/pdf-viewer-dialog";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Asset } from "@/types/assets";
import React from "react";
import { FaFile, FaFilePdf, FaImage } from "react-icons/fa";

interface Props {
  onClose: () => void
  ;
  assets: Asset[];
}

const LectureAssetsModal: React.FC<Props> = ({ onClose, assets }) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>PDFs</DialogHeader>
        {assets.length === 0 ? (
          <p className="text-center p-5">PDF is not available yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="p-5 rounded-xl w-52 h-fit bg-card/85"
              >
                {asset.type === "Image" && (
                  <PdfOpenButton asset={asset} className="w-full">
                    <FaImage className="w-full h-full text-primary/40" />
                  </PdfOpenButton>
                )}
                {asset.type === "Pdf" && (
                  <PdfOpenButton asset={asset} className="w-full">
                    <FaFilePdf className="w-full h-full text-primary/40" />
                  </PdfOpenButton>
                )}
                {asset.type === "Unknown" && (
                  <PdfOpenButton asset={asset} className="w-full">
                    <FaFile className="w-full h-full text-primary/40" />
                  </PdfOpenButton>
                )}
                <p className="mt-2 font-medium">{asset.name}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LectureAssetsModal;
