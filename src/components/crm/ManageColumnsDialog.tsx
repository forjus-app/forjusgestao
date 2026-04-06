import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCrmColumns, useCreateCrmColumn, useUpdateCrmColumn, useDeleteCrmColumn } from "@/hooks/useCrm";

interface ManageColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageColumnsDialog({ open, onOpenChange }: ManageColumnsDialogProps) {
  const { data: columns } = useCrmColumns();
  const createColumn = useCreateCrmColumn();
  const updateColumn = useUpdateCrmColumn();
  const deleteColumn = useDeleteCrmColumn();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createColumn.mutateAsync({
      name: newName.trim(),
      color: newColor,
      sort_order: (columns?.length || 0) + 1,
    });
    setNewName("");
  };

  const handleRename = async (id: string, name: string) => {
    await updateColumn.mutateAsync({ id, name });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Colunas</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {columns?.map((col) => (
            <div key={col.id} className="flex items-center gap-2">
              <input
                type="color"
                value={col.color || "#3b82f6"}
                onChange={(e) => updateColumn.mutate({ id: col.id, color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
              <Input
                defaultValue={col.name}
                onBlur={(e) => handleRename(col.id, e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteColumn.mutate(col.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2 border-t">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nova coluna..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button size="icon" className="h-8 w-8" onClick={handleAdd}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
