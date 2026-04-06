import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Plus, Settings2, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCrmColumns,
  useCrmLeads,
  useCrmCategories,
  useInitCrmColumns,
  useMoveCrmLead,
  useDeleteCrmLead,
} from "@/hooks/useCrm";
import { CrmLeadCard } from "@/components/crm/CrmLeadCard";
import { AddLeadDialog } from "@/components/crm/AddLeadDialog";
import { LeadDetailDrawer } from "@/components/crm/LeadDetailDrawer";
import { ManageColumnsDialog } from "@/components/crm/ManageColumnsDialog";
import { ManageCategoriesDialog } from "@/components/crm/ManageCategoriesDialog";
import { cn } from "@/lib/utils";

export default function Crm() {
  const { data: columns, isLoading: columnsLoading } = useCrmColumns();
  const { data: leads } = useCrmLeads();
  const { data: categories } = useCrmCategories();
  const initColumns = useInitCrmColumns();
  const moveLead = useMoveCrmLead();
  const deleteLead = useDeleteCrmLead();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addColumnId, setAddColumnId] = useState("");
  const [detailLead, setDetailLead] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterColumn, setFilterColumn] = useState("all");

  // Drag state
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dragFromColumn, setDragFromColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (columns && columns.length === 0 && !columnsLoading) {
      initColumns.mutate();
    }
  }, [columns, columnsLoading]);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    let result = leads;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(s) ||
          l.phone?.toLowerCase().includes(s) ||
          l.email?.toLowerCase().includes(s) ||
          l.city?.toLowerCase().includes(s) ||
          (l as any).crm_categories?.name?.toLowerCase().includes(s) ||
          l.summary?.toLowerCase().includes(s)
      );
    }
    if (filterCategory && filterCategory !== "all") {
      result = result.filter((l) => l.category_id === filterCategory);
    }
    if (filterColumn && filterColumn !== "all") {
      result = result.filter((l) => l.column_id === filterColumn);
    }
    return result;
  }, [leads, search, filterCategory, filterColumn]);

  const getLeadsForColumn = (columnId: string) =>
    filteredLeads.filter((l) => l.column_id === columnId);

  const handleDragStart = useCallback((leadId: string, fromColumnId: string, e: React.DragEvent) => {
    setDragLeadId(leadId);
    setDragFromColumn(fromColumnId);
    setIsDragging(true);
    
    // Set drag image with slight opacity
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", leadId);
      // Make the drag ghost semi-transparent
      const el = e.currentTarget as HTMLElement;
      setTimeout(() => {
        el.style.opacity = "0.4";
      }, 0);
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "1";
    setDragLeadId(null);
    setDragFromColumn(null);
    setDragOverColumn(null);
    setIsDragging(false);
    dragCounterRef.current = {};
  }, []);

  const handleColumnDragEnter = useCallback((columnId: string) => {
    dragCounterRef.current[columnId] = (dragCounterRef.current[columnId] || 0) + 1;
    setDragOverColumn(columnId);
  }, []);

  const handleColumnDragLeave = useCallback((columnId: string) => {
    dragCounterRef.current[columnId] = (dragCounterRef.current[columnId] || 0) - 1;
    if (dragCounterRef.current[columnId] <= 0) {
      dragCounterRef.current[columnId] = 0;
      setDragOverColumn((prev) => (prev === columnId ? null : prev));
    }
  }, []);

  const handleDrop = useCallback((toColumnId: string) => {
    if (dragLeadId && dragFromColumn && dragFromColumn !== toColumnId) {
      moveLead.mutate({ leadId: dragLeadId, fromColumnId: dragFromColumn, toColumnId });
    }
    setDragLeadId(null);
    setDragFromColumn(null);
    setDragOverColumn(null);
    setIsDragging(false);
    dragCounterRef.current = {};
  }, [dragLeadId, dragFromColumn, moveLead]);

  const openAddDialog = (columnId: string) => {
    setAddColumnId(columnId);
    setAddDialogOpen(true);
  };

  const openDetail = (lead: any) => {
    setDetailLead(lead);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM de Atendimento</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus leads e potenciais clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setManageCategoriesOpen(true)}>
            <Tag className="h-4 w-4 mr-1" /> Categorias
          </Button>
          <Button variant="outline" size="sm" onClick={() => setManageColumnsOpen(true)}>
            <Settings2 className="h-4 w-4 mr-1" /> Colunas
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone, e-mail, cidade..."
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterColumn} onValueChange={setFilterColumn}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Coluna" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas colunas</SelectItem>
            {columns?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <ScrollArea className="flex-1 -mx-2">
        <div className="flex gap-4 px-2 pb-4 min-h-[500px]">
          {columns?.map((column) => {
            const colLeads = getLeadsForColumn(column.id);
            const isOver = isDragging && dragOverColumn === column.id;
            const isSource = isDragging && dragFromColumn === column.id;
            const canDrop = isDragging && dragFromColumn !== column.id;

            return (
              <div
                key={column.id}
                className={cn(
                  "flex-shrink-0 w-72 flex flex-col rounded-lg transition-all duration-200",
                  isOver
                    ? "bg-primary/10 ring-2 ring-primary/40 ring-inset scale-[1.01]"
                    : canDrop
                    ? "bg-muted/30 ring-1 ring-dashed ring-muted-foreground/20"
                    : "bg-muted/50"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragEnter={() => handleColumnDragEnter(column.id)}
                onDragLeave={() => handleColumnDragLeave(column.id)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(column.id);
                }}
              >
                {/* Column header */}
                <div className={cn(
                  "flex items-center justify-between p-3 border-b transition-colors duration-200",
                  isOver && "border-primary/30"
                )}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn("w-3 h-3 rounded-full transition-transform duration-200", isOver && "scale-125")}
                      style={{ backgroundColor: column.color || "#3b82f6" }}
                    />
                    <h3 className="text-sm font-semibold text-foreground">{column.name}</h3>
                    <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center">
                      {colLeads.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openAddDialog(column.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Cards area */}
                <div className={cn(
                  "flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] transition-all duration-200 min-h-[80px]",
                  isOver && "bg-primary/5",
                )}>
                  {colLeads.length === 0 && isOver && (
                    <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 text-center text-xs text-primary/60 font-medium animate-pulse">
                      Soltar aqui
                    </div>
                  )}
                  {colLeads.length === 0 && !isDragging && (
                    <div className="text-center text-xs text-muted-foreground/50 py-8">
                      Nenhum lead
                    </div>
                  )}
                  {colLeads.map((lead) => (
                    <CrmLeadCard
                      key={lead.id}
                      lead={lead}
                      columns={columns || []}
                      isDragging={dragLeadId === lead.id}
                      onOpen={() => openDetail(lead)}
                      onMove={(toColumnId) =>
                        moveLead.mutate({ leadId: lead.id, fromColumnId: lead.column_id, toColumnId })
                      }
                      onDelete={() => deleteLead.mutate(lead.id)}
                      onDragStart={(e) => handleDragStart(lead.id, lead.column_id, e)}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                  {colLeads.length > 0 && isOver && (
                    <div className="border-2 border-dashed border-primary/40 rounded-lg p-3 text-center text-xs text-primary/60 font-medium">
                      Soltar aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Dialogs */}
      <AddLeadDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} columnId={addColumnId} />
      <LeadDetailDrawer
        lead={detailLead}
        columns={columns || []}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      <ManageColumnsDialog open={manageColumnsOpen} onOpenChange={setManageColumnsOpen} />
      <ManageCategoriesDialog open={manageCategoriesOpen} onOpenChange={setManageCategoriesOpen} />
    </div>
  );
}
