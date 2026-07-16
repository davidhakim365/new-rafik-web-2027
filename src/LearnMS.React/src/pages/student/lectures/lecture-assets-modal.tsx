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
  const href = (asset: Asset) => asset.url || `/api/assets/${asset.id}`;

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
                className="p-5 rounded-xl w-52 h-fit bg-white/40"
              >
                {asset.type === "Image" && (
                  <a href={href(asset)} target="_blank" rel="noreferrer">
                    <FaImage className="w-full h-full text-primary/40" />
                  </a>
                )}
                {asset.type === "Pdf" && (
                  <a href={href(asset)} target="_blank" rel="noreferrer">
                    <FaFilePdf className="w-full h-full text-primary/40" />
                  </a>
                )}
                {asset.type === "Unknown" && (
                  <a href={href(asset)} target="_blank" rel="noreferrer">
                    <FaFile className="w-full h-full text-primary/40" />
                  </a>
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
