import { useState, useEffect, useMemo } from "react";
import { Plus, Settings2, Search, Filter, Tag } from "lucide-react";
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
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [dragFromColumn, setDragFromColumn] = useState<string | null>(null);

  // Auto-seed columns on first visit
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

  const handleDrop = (toColumnId: string) => {
    if (dragLeadId && dragFromColumn && dragFromColumn !== toColumnId) {
      moveLead.mutate({ leadId: dragLeadId, fromColumnId: dragFromColumn, toColumnId });
    }
    setDragLeadId(null);
    setDragFromColumn(null);
  };

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
            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-72 flex flex-col bg-muted/50 rounded-lg"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color || "#3b82f6" }} />
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

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {colLeads.map((lead) => (
                    <CrmLeadCard
                      key={lead.id}
                      lead={lead}
                      columns={columns || []}
                      onOpen={() => openDetail(lead)}
                      onMove={(toColumnId) =>
                        moveLead.mutate({ leadId: lead.id, fromColumnId: lead.column_id, toColumnId })
                      }
                      onDelete={() => deleteLead.mutate(lead.id)}
                      onDragStart={() => {
                        setDragLeadId(lead.id);
                        setDragFromColumn(lead.column_id);
                      }}
                    />
                  ))}
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
