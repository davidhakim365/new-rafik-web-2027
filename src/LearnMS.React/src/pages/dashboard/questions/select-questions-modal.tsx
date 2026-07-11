import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import QuestionsList from "@/pages/dashboard/questions/questions-list";
import React from "react";

type SelectQuestionsModalProps = {
  onClose: () => void;
};

const SelectQuestionsModal: React.FC<SelectQuestionsModalProps> = ({
  onClose,
}) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className='min-w-[70%] max-h-[100vh]'>
        <DialogHeader>
          <DialogTitle>Select Questions</DialogTitle>
        </DialogHeader>
        <ScrollArea>
          <QuestionsList />
          <ScrollBar orientation='vertical' />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SelectQuestionsModal;
