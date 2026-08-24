import { useRenameAssetMutation } from "@/api/assets-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/utils";
import { Asset } from "@/types/assets";
import { Check, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";

type AssetTitleCellProps = {
  asset: Asset;
};

export function AssetTitleCell({ asset }: AssetTitleCellProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(asset.name);
  const rename = useRenameAssetMutation();

  useEffect(() => {
    setValue(asset.name);
  }, [asset.name]);

  const cancel = () => {
    setValue(asset.name);
    setEditing(false);
  };

  const save = () => {
    const next = value.trim();
    if (!next) {
      toast({
        title: "Title required",
        description: "Enter a name for this PDF.",
        variant: "destructive",
      });
      return;
    }

    if (next === asset.name) {
      setEditing(false);
      return;
    }

    rename.mutate(
      { id: asset.id, name: next },
      {
        onSuccess: (res) => {
          setEditing(false);
          toast({
            title: "PDF title updated",
            description: res.message,
          });
        },
      }
    );
  };

  if (!editing) {
    return (
      <button
        type="button"
        className="flex max-w-full items-center gap-2 text-left"
        onClick={() => setEditing(true)}
      >
        <span className="min-w-0 flex-1 truncate">{asset.name}</span>
        <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div
      className="flex min-w-0 items-center gap-1"
      onClick={(event) => event.stopPropagation()}
    >
      <Input
        value={value}
        autoFocus
        disabled={rename.isPending}
        maxLength={200}
        className="h-8 min-w-0 text-left"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0"
        disabled={rename.isPending}
        onClick={save}
        aria-label="Save title"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0"
        disabled={rename.isPending}
        onClick={cancel}
        aria-label="Cancel"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
