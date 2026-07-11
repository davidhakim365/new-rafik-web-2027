import { Button } from "@/components/ui/button";
import QuestionsList from "@/pages/dashboard/questions/questions-list";
import { useModalStore } from "@/store/use-modal-store";
import { Plus } from "lucide-react";

const QuestionsPage = () => {
  const { openModal } = useModalStore();

  return (
    <div className="w-full h-full p-4 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Questions</h1>
        <div className="flex flex-col gap-2">
          <Button onClick={() => openModal("add-multiple-question-modal")}>
            <Plus />
            Add Multiple Choice Question
          </Button>
          <Button onClick={() => openModal("add-value-question-modal")}>
            <Plus />
            Add Value Question
          </Button>
        </div>
      </div>
      <QuestionsList />
    </div>
  );
};

export default QuestionsPage;
