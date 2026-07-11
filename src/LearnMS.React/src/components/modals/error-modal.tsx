import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageCircleWarningIcon } from "lucide-react";
import React from "react";

interface ErrorModal {
  onClose: () => void;
  render: ({ onClose }: { onClose: () => void }) => JSX.Element;
}

const ErrorModal: React.FC<ErrorModal> = ({ onClose, render }) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className='p-10'>
        <DialogHeader>
          <DialogTitle className=''>
            <MessageCircleWarningIcon className='w-16 h-16 text-6xl text-red-500 ms-auto' />
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className='text-lg text-center'>
          {render({ onClose })}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorModal;
