import { useUpdateQuestionMutation } from "@/api/questions-api";
import { InlineQuestionEditor } from "@/components/assessment/inline-question-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/lib/utils";
import { draftToPayload, questionToDraft } from "@/types/assessment";
import { Question } from "@/types/question";
import { useState } from "react";

export default function EditQuestionModal({
  onClose,
  question,
}: {
  onClose: () => void;
  question: Question;
}) {
  const [draft, setDraft] = useState(() => questionToDraft(question));
  const updateQuestionMutation = useUpdateQuestionMutation();

  const onSave = () => {
    if (draft.questionType === "MultipleChoice") {
      const choices = draft.multipleChoices ?? [];
      if (choices.length < 2) {
        toast({
          title: "Need two choices",
          description: "Add at least two answer choices.",
          variant: "destructive",
        });
        return;
      }
      if (
        !choices.every((c) => (c.text && c.text.trim().length > 0) || c.imageUrl)
      ) {
        toast({
          title: "Incomplete choices",
          description: "Each choice needs text or an image.",
          variant: "destructive",
        });
        return;
      }
      if (!choices.some((c) => c.id === draft.multipleCorrect)) {
        toast({
          title: "Pick the correct choice",
          description: "Select which option is the right answer.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!draft.text.trim() && !draft.image) {
      toast({
        title: "Question is empty",
        description: "Add question text or a photo.",
        variant: "destructive",
      });
      return;
    }

    const payload = draftToPayload({
      ...draft,
      text: draft.text.trim() || draft.description.trim() || "Question",
      description:
        draft.description.trim() || draft.text.trim() || "Question",
    });

    updateQuestionMutation.mutate(
      {
        id: question.id,
        text: payload.text!,
        description: payload.description!,
        image: payload.image || undefined,
        questionType: draft.questionType,
        multipleCorrect: payload.multipleCorrect,
        multipleChoices: payload.multipleChoices,
        valueCorrect: payload.valueCorrect,
        valueTolerance: payload.valueTolerance,
        essayMaxLength: payload.essayMaxLength,
      },
      {
        onSuccess: () => {
          toast({
            title: "Question updated",
            description: "Text, photo, and answers were saved.",
          });
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[60vw] max-w-screen-xl max-h-[100vh] overflow-y-auto text-foreground">
        <DialogHeader>
          <DialogTitle>Edit question</DialogTitle>
        </DialogHeader>
        <InlineQuestionEditor
          draft={draft}
          onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          onRemove={onClose}
          hideRemove
          showDescription
        />
        <Button
          type="button"
          className="w-full"
          disabled={updateQuestionMutation.isPending}
          onClick={onSave}
        >
          Save changes
        </Button>
      </DialogContent>
    </Dialog>
  );
}
