import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Plus, Tags, X } from "lucide-react";
import { toast } from "sonner";
import { useDeadlineTags, useCreateDeadlineTag } from "@/hooks/useDeadlineTags";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

interface DeadlineTagsFieldProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
}

export function DeadlineTagsField({ value, onChange }: DeadlineTagsFieldProps) {
  const { data: tags } = useDeadlineTags();
  const createTag = useCreateDeadlineTag();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[5]);

  const selected = (tags || []).filter((t) => value.includes(t.id));

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Informe o nome da etiqueta");
      return;
    }
    try {
      const tag = await createTag.mutateAsync({ name: newName, color: newColor });
      onChange([...value, tag.id]);
      setNewName("");
      setCreateOpen(false);
      toast.success("Etiqueta criada!");
    } catch (e: any) {
      toast.error(e.message?.includes("duplicate") ? "Já existe uma etiqueta com esse nome" : "Erro ao criar etiqueta");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Tags className="h-4 w-4" />
        Etiquetas
      </Label>

      <div className="flex flex-wrap gap-1.5">
        {selected.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            className="gap-1 border-transparent"
            style={
              tag.color
                ? { backgroundColor: `${tag.color}22`, color: tag.color, borderColor: `${tag.color}66` }
                : undefined
            }
          >
            {tag.name}
            <button type="button" onClick={() => toggle(tag.id)}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-full justify-start">
            <Plus className="h-4 w-4 mr-2" />
            {selected.length > 0 ? "Gerenciar etiquetas" : "Adicionar etiquetas"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar etiqueta..." />
            <CommandList>
              <CommandEmpty>Nenhuma etiqueta encontrada</CommandEmpty>
              <CommandGroup>
                {(tags || []).map((tag) => (
                  <CommandItem key={tag.id} value={tag.name} onSelect={() => toggle(tag.id)}>
                    <span
                      className="h-2.5 w-2.5 rounded-full mr-2 shrink-0"
                      style={{ backgroundColor: tag.color || "#6b7280" }}
                    />
                    <span className="flex-1 truncate">{tag.name}</span>
                    {value.includes(tag.id) && <Check className="h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  value="__create__"
                  onSelect={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar nova etiqueta
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova etiqueta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: URGENTE"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`h-7 w-7 rounded-full border-2 ${
                      newColor === color ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createTag.isPending}>
              {createTag.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
