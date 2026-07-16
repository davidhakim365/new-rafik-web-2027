import {
  CenterDto,
  readSelectedCenterId,
  useCreateCenter,
  useGetCenters,
  writeSelectedCenterId,
} from "@/api/centers-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/utils";
import { Building2, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type CenterSelectorProps = {
  value: string | null;
  onChange: (centerId: string | null, center?: CenterDto) => void;
  className?: string;
};

export function CenterSelector({ value, onChange, className }: CenterSelectorProps) {
  const { data, isLoading } = useGetCenters();
  const { mutate: createCenter, isPending: isCreating } = useCreateCenter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCenterName, setNewCenterName] = useState("");

  const centers = data?.data ?? [];

  useEffect(() => {
    if (centers.length === 0) return;

    const targetId = value ?? readSelectedCenterId();
    if (!targetId) return;

    const center = centers.find((c) => c.id === targetId);
    if (center) {
      onChange(center.id, center);
    }
  }, [centers, onChange, value]);

  const handleSelect = (centerId: string) => {
    const center = centers.find((c) => c.id === centerId);
    writeSelectedCenterId(centerId);
    onChange(centerId, center);
  };

  const handleCreate = () => {
    const name = newCenterName.trim();
    if (name.length < 2) {
      toast({
        title: "Invalid name",
        description: "Center name must be at least 2 characters.",
        variant: "destructive",
      });
      return;
    }

    createCenter(name, {
      onSuccess: (response) => {
        const center = response.data;
        writeSelectedCenterId(center.id);
        onChange(center.id, center);
        setNewCenterName("");
        setDialogOpen(false);
        toast({
          title: "Center added",
          description: `${center.name} is ready for attendance.`,
        });
      },
    });
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-primary" />
          <Select
            value={value ?? undefined}
            onValueChange={handleSelect}
            disabled={isLoading || centers.length === 0}
          >
            <SelectTrigger className="w-full sm:min-w-[220px]">
              <SelectValue
                placeholder={
                  isLoading ? "Loading centers..." : "Select attendance center"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {centers.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2 sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Center
            </Button>
          </DialogTrigger>
          <DialogContent className="text-foreground">
            <DialogHeader>
              <DialogTitle>Add New Center</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Center name..."
              value={newCenterName}
              onChange={(e) => setNewCenterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="gap-2"
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Center
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
