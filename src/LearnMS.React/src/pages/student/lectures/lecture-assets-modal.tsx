import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Asset } from "@/types/assets";
import React from "react";
import { FaFile, FaFilePdf, FaImage } from "react-icons/fa";

interface Props {
  onClose: () => void
  ;
  assets: Asset[];
}

const LectureAssetsModal: React.FC<Props> = ({ onClose, assets }) =>{
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
      <DialogHeader>PDFs</DialogHeader>
{assets.length === 0 ? (
  <p className='text-center p-5'>PDF is not available yet</p>
) : (
  <div className='flex flex-wrap gap-2'>
    {assets.map((asset) => (
      <div
        key={asset.id}
        className='p-5 rounded-xl w-52 h-fit bg-white/40'>
        {asset.type === "Image" && (
          <a href={`/api/assets/${asset.id}`}>
            <FaImage className='w-full h-full text-primary/40' />
          </a>
        )}
        {asset.type === "Pdf" && (
          <a href={`/api/assets/${asset.id}`}>
            <FaFilePdf className='w-full h-full text-primary/40' />
          </a>
        )}
        {asset.type === "Unknown" && (
          <a href={`/api/assets/${asset.id}`}>
            <FaFile className='w-full h-full text-primary/40' />
          </a>
        )}
        <p className=''>{asset.name}</p>
      </div>
    ))}
  </div>
)}

      </DialogContent>
    </Dialog>
  );
};

export default LectureAssetsModal;
