import { useDeleteQuestionMutation } from "@/api/questions-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { toast } from "@/lib/utils";
import { useModalStore } from "@/store/use-modal-store";
import { getQuestionType, QuestionBodyLike } from "@/types/assessment";
import { Question } from "@/types/question";
import { ColumnDef } from "@tanstack/react-table";

function questionBody(question: Question): QuestionBodyLike {
  return (question.body ?? {}) as QuestionBodyLike;
}

export const questionsColumns: ColumnDef<Question>[] = [
  {
    id: "select",
    size: 10,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "image",
    header: "Image",
    maxSize: 10,
    cell: ({ row }) => (
      <HoverCard>
        <HoverCardTrigger className="w-[40px] h-[40px]">
          <img
            className="object-cover w-10 h-10 rounded"
            src={row.original.image ?? ""}
            alt="Question Image"
          />
        </HoverCardTrigger>
        <HoverCardContent className="shadow-md shadow-primary">
          <img
            className="object-cover rounded"
            src={row.original.image ?? ""}
            alt="Question Image"
          />
        </HoverCardContent>
      </HoverCard>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <p className="w-[200px] truncate">{row.original.description}</p>
    ),
  },
  {
    accessorKey: "text",
    header: "Question",
    size: 10,
    cell: ({ row }) => {
      const question = row.original;
      const body = questionBody(question);
      const type = getQuestionType(body);
      return (
        <HoverCard>
          <HoverCardTrigger className="mb-4 max-w-[200px] text-sm whitespace-normal break-words">
            {question.text}
          </HoverCardTrigger>
          <HoverCardContent className="flex flex-col items-start gap-2 rounded shadow-md shadow-primary max-w-[300px] text-sm">
            <p className="w-full mb-4 border-b-2 border-b-primary text-sm whitespace-normal break-words">
              {question.text}
            </p>
            {type === "MultipleChoice" && Array.isArray(body.choices) && (
              <div className="flex flex-col gap-2 ml-2">
                {body.choices.map((choice, i) => {
                  const label =
                    typeof choice === "string"
                      ? choice
                      : choice.text || choice.imageUrl || choice.id;
                  const id = typeof choice === "string" ? choice : choice.id;
                  return (
                    <Badge
                      key={`${id}-${i}`}
                      variant={
                        String(body.correctAnswer) === String(id)
                          ? "default"
                          : "outline"
                      }
                    >
                      {label}
                    </Badge>
                  );
                })}
              </div>
            )}
            {type === "ValueTolerance" && (
              <div className="flex gap-2 ml-2">
                <Badge>{body.correctAnswer}</Badge>
                <Badge variant={"outline"}>{body.tolerance}</Badge>
              </div>
            )}
          </HoverCardContent>
        </HoverCard>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <p>{new Date(row.original.createdAt).toLocaleString()}</p>
    ),
  },
  {
    id: "actions",
    size: 10,
    header: "Actions",
    cell: ({ row }) => {
      const deleteQuestionMutation = useDeleteQuestionMutation();
      const { openModal } = useModalStore();

      const onDelete = () => {
        deleteQuestionMutation.mutate(row.original.id, {
          onSuccess: () => {
            toast({
              title: "Question deleted",
              description: "The question has been deleted successfully.",
            });
          },
        });
      };

      return (
        <div className="flex flex-col gap-2 min-w-[96px]">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              openModal("edit-question-modal", { question: row.original })
            }
          >
            Edit
          </Button>
          <Button
            onClick={onDelete}
            variant="destructive"
            className="w-full"
            disabled={deleteQuestionMutation.isPending}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];
