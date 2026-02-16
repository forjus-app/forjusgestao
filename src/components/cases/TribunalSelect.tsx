import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TribunalSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function TribunalSelect({ value, onChange, id }: TribunalSelectProps) {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTribunal, setNewTribunal] = useState({ name: "", code: "", segment: "", uf: "" });

  const { data: tribunals = [] } = useQuery({
    queryKey: ["tribunals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tribunals")
        .select("*")
        .eq("is_active", true)
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return tribunals;
    const q = search.toLowerCase();
    return tribunals.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.code && t.code.toLowerCase().includes(q)) ||
        (t.uf && t.uf.toLowerCase().includes(q))
    );
  }, [tribunals, search]);

  const selectedLabel = useMemo(() => {
    if (!value) return null;
    const found = tribunals.find(
      (t) => t.code === value || t.name === value
    );
    return found ? `${found.code} — ${found.name}` : value;
  }, [value, tribunals]);

  const createTribunal = useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error("Organização não encontrada");
      const { data, error } = await supabase
        .from("tribunals")
        .insert({
          organization_id: organization.id,
          name: newTribunal.name,
          code: newTribunal.code || null,
          segment: newTribunal.segment || null,
          uf: newTribunal.uf || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tribunals"] });
      const val = data.code || data.name;
      onChange(val);
      setCreateOpen(false);
      setNewTribunal({ name: "", code: "", segment: "", uf: "" });
      toast.success("Tribunal cadastrado!");
    },
    onError: () => {
      toast.error("Erro ao cadastrar tribunal");
    },
  });

  const handleSelect = (tribunal: typeof tribunals[0]) => {
    const val = tribunal.code || tribunal.name;
    onChange(val);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal h-10"
          >
            <span className="truncate">
              {selectedLabel || "Selecione o tribunal..."}
            </span>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              {value && (
                <X
                  className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                  onClick={handleClear}
                />
              )}
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50 bg-popover" align="start">
          <div className="p-2 border-b">
            <Input
              placeholder="Buscar tribunal (TJSP, TRF3...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-[240px]">
            <div className="p-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum tribunal encontrado
                </p>
              ) : (
                filtered.map((t) => {
                  const val = t.code || t.name;
                  const isSelected = value === val;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={cn(
                        "flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left",
                        isSelected && "bg-accent"
                      )}
                      onClick={() => handleSelect(t)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-medium shrink-0">{t.code}</span>
                      <span className="text-muted-foreground truncate">
                        {t.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-1">
            <button
              type="button"
              className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-primary"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Criar novo tribunal
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Tribunal</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!newTribunal.name.trim()) {
                toast.error("Nome é obrigatório");
                return;
              }
              createTribunal.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Tribunal de Justiça de..."
                value={newTribunal.name}
                onChange={(e) =>
                  setNewTribunal((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Sigla</Label>
                <Input
                  placeholder="TJSP"
                  value={newTribunal.code}
                  onChange={(e) =>
                    setNewTribunal((p) => ({ ...p, code: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Input
                  placeholder="Estadual"
                  value={newTribunal.segment}
                  onChange={(e) =>
                    setNewTribunal((p) => ({ ...p, segment: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input
                  placeholder="SP"
                  maxLength={2}
                  value={newTribunal.uf}
                  onChange={(e) =>
                    setNewTribunal((p) => ({ ...p, uf: e.target.value.toUpperCase() }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createTribunal.isPending}>
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
