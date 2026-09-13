import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/store/use-modal-store";
import { getQuestionType, QuestionBodyLike } from "@/types/assessment";
import { Delete, Pencil } from "lucide-react";

export type BankQuestionCardModel = {
  id: string;
  text: string;
  description?: string;
  image?: string | null;
  body?: QuestionBodyLike;
};

export function BankQuestionCard({
  question,
  onRemove,
}: {
  question: BankQuestionCardModel;
  onRemove: () => void;
}) {
  const { openModal } = useModalStore();
  const body = question.body ?? {};
  const typeName = getQuestionType(body);

  return (
    <Card className="relative w-full rounded-3xl overflow-clip flex flex-col sm:flex-row bg-primary/10 text-primary p-0 border-0 min-h-[120px]">
      <Badge className="absolute top-2 left-2 z-10">{typeName}</Badge>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <Button
          className="bg-background/90 text-foreground hover:bg-background"
          variant="secondary"
          type="button"
          onClick={() => openModal("edit-question-modal", { question })}
          size="icon"
          title="Edit question"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          type="button"
          onClick={onRemove}
          size="icon"
          title="Remove from this quiz"
        >
          <Delete />
        </Button>
      </div>
      {question.image && (
        <HoverCard>
          <HoverCardTrigger className="h-[160px] w-full sm:w-[200px] p-0 shrink-0">
            <CardHeader className="h-full p-0">
              <img
                src={question.image}
                className="object-cover object-center w-full h-full"
                alt=""
              />
            </CardHeader>
          </HoverCardTrigger>
          <HoverCardContent
            side="left"
            className="p-0 w-[500px] rounded overflow-clip aspect-square shadow-primary shadow-md"
          >
            <img src={question.image} className="w-full h-full" alt="" />
          </HoverCardContent>
        </HoverCard>
      )}
      <CardContent className={cn("flex flex-col items-start p-4 gap-2")}>
        <h2 className="text-xl pr-20">{question.text}</h2>
        {question.description && (
          <p className="text-sm opacity-80">{question.description}</p>
        )}
        {Array.isArray(body.choices) && (
          <div className="flex flex-wrap gap-2">
            {body.choices.map((o, i) => {
              const label =
                typeof o === "string" ? o : o.text || o.imageUrl || o.id;
              const id = typeof o === "string" ? o : o.id;
              const isCorrect = String(body.correctAnswer) === String(id);
              return (
                <Badge key={i} variant={isCorrect ? "default" : "secondary"}>
                  {label}
                </Badge>
              );
            })}
          </div>
        )}
        {body.tolerance != null && (
          <p className="text-sm">
            Answer: {body.correctAnswer} ± {body.tolerance}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
