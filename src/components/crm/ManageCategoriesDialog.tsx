import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCrmCategories, useCreateCrmCategory, useDeleteCrmCategory } from "@/hooks/useCrm";

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageCategoriesDialog({ open, onOpenChange }: ManageCategoriesDialogProps) {
  const { data: categories } = useCrmCategories();
  const createCategory = useCreateCrmCategory();
  const deleteCategory = useDeleteCrmCategory();
  const [newName, setNewName] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createCategory.mutateAsync({
      name: newName.trim(),
      sort_order: (categories?.length || 0) + 1,
    });
    setNewName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Categorias de Caso</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {categories?.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <span className="flex-1 text-sm">{cat.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => deleteCategory.mutate(cat.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nova categoria..."
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
