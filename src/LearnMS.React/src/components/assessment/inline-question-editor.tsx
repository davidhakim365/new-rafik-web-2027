import { ImageUploadField } from "@/components/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createDefaultMultipleChoices,
  createEmptyChoice,
  DraftQuestion,
  QuestionChoiceDraft,
} from "@/types/assessment";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  draft: DraftQuestion;
  onChange: (patch: Partial<DraftQuestion>) => void;
  onRemove: () => void;
  hideRemove?: boolean;
  showDescription?: boolean;
};

export function InlineQuestionEditor({
  draft,
  onChange,
  onRemove,
  hideRemove,
  showDescription,
}: Props) {
  const [uploading, setUploading] = useState(false);

  const setChoice = (id: string, patch: Partial<QuestionChoiceDraft>) => {
    onChange({
      multipleChoices: (draft.multipleChoices ?? []).map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    });
  };

  return (
    <div className="w-full rounded-2xl border border-primary/20 bg-background/80 p-4 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={draft.questionType}
            onValueChange={(v) => {
              const type = v as DraftQuestion["questionType"];
              const patch: Partial<DraftQuestion> = { questionType: type };
              if (type === "MultipleChoice" && !draft.multipleChoices?.length) {
                const choices = createDefaultMultipleChoices();
                patch.multipleChoices = choices;
                patch.multipleCorrect = choices[0].id;
              }
              if (type === "ValueTolerance") {
                patch.valueCorrect = draft.valueCorrect ?? 0;
                patch.valueTolerance = draft.valueTolerance ?? 0;
              }
              onChange(patch);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MultipleChoice">Multiple Choice</SelectItem>
              <SelectItem value="ValueTolerance">Number (tolerance)</SelectItem>
              <SelectItem value="Essay">Essay (manual grade)</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={draft.inputMode}
            onValueChange={(v) =>
              onChange({ inputMode: v as "photo" | "text" })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="photo">Photo question</SelectItem>
              <SelectItem value="text">Write question</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!hideRemove && (
          <Button type="button" variant="destructive" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showDescription && (
        <div className="space-y-2">
          <Label>Bank label / description</Label>
          <Input
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Short label in the question bank"
          />
        </div>
      )}

      {draft.inputMode === "photo" ? (
        <div className="space-y-2">
          <Label>Question photo</Label>
          <ImageUploadField
            value={draft.image}
            onChange={(url) => onChange({ image: url })}
            capturePaste
            disabled={uploading}
            onUploadingChange={setUploading}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Question text</Label>
          <Textarea
            value={draft.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Write the question..."
            rows={3}
          />
          <Label className="text-muted-foreground text-xs">
            Optional image
          </Label>
          <ImageUploadField
            value={draft.image}
            onChange={(url) => onChange({ image: url })}
            capturePaste
            disabled={uploading}
            onUploadingChange={setUploading}
          />
        </div>
      )}

      {draft.questionType === "MultipleChoice" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Choices</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const existing = draft.multipleChoices ?? [];
                onChange({
                  multipleChoices: [
                    ...existing,
                    createEmptyChoice(existing.length),
                  ],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add choice
            </Button>
          </div>
          <RadioGroup
            value={draft.multipleCorrect}
            onValueChange={(v) => onChange({ multipleCorrect: v })}
            className="space-y-3"
          >
            {(draft.multipleChoices ?? []).map((c, idx) => (
              <div
                key={c.id}
                className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-start"
              >
                <div className="flex items-center gap-2 pt-2">
                  <RadioGroupItem value={c.id} id={c.id} />
                  <span className="text-sm text-muted-foreground">
                    Correct
                  </span>
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder={`e.g. ${String.fromCharCode(97 + idx)}) answer text`}
                    value={c.text ?? ""}
                    onChange={(e) => setChoice(c.id, { text: e.target.value })}
                  />
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <ImagePlus className="h-3 w-3" /> Or image
                    </Label>
                    <ImageUploadField
                      compact
                      value={c.imageUrl}
                      onChange={(url) => setChoice(c.id, { imageUrl: url })}
                      disabled={uploading}
                      onUploadingChange={setUploading}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    onChange({
                      multipleChoices: (draft.multipleChoices ?? []).filter(
                        (x) => x.id !== c.id
                      ),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {draft.questionType === "ValueTolerance" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Correct number</Label>
            <Input
              type="number"
              step="any"
              value={draft.valueCorrect ?? 0}
              onChange={(e) =>
                onChange({ valueCorrect: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label>Tolerance (±)</Label>
            <Input
              type="number"
              step="any"
              value={draft.valueTolerance ?? 0}
              onChange={(e) =>
                onChange({ valueTolerance: Number(e.target.value) })
              }
            />
          </div>
        </div>
      )}

      {draft.questionType === "Essay" && (
        <p className="text-sm text-muted-foreground">
          Students write a text answer. You grade it later — it does not count
          toward the pass score until graded.
        </p>
      )}
    </div>
  );
}
