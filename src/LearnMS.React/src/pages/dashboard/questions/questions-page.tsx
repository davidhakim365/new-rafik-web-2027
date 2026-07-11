import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import QuestionsList from "@/pages/dashboard/questions/questions-list";
import { useModalStore } from "@/store/use-modal-store";
import { HelpCircle, Plus } from "lucide-react";

const QuestionsPage = () => {
  const { openModal } = useModalStore();

  return (
    <DashboardPageShell
      title="Questions"
      description="Build and manage your question bank for quizzes and exams."
      icon={HelpCircle}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-color2/20"
            onClick={() => openModal("add-multiple-question-modal")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Multiple Choice
          </Button>
          <Button
            className="bg-gradient-to-r from-color1 to-color2 shadow-md shadow-color2/20 hover:opacity-90"
            onClick={() => openModal("add-value-question-modal")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Value Question
          </Button>
        </div>
      }
      fullWidth
    >
      <DashboardCard padding="sm">
        <QuestionsList />
      </DashboardCard>
    </DashboardPageShell>
  );
};

export default QuestionsPage;
