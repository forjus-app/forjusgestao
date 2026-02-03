import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Building2, Loader2, Phone, Mail, Eye } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactLinkedCases } from "@/components/contacts/ContactLinkedCases";

export default function Contacts() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "PF",
    name: "",
    cpf_cnpj: "",
    email: "",
    phone: "",
    whatsapp: "",
    city: "",
    state: "",
    notes: "",
  });

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts", organization?.id, search, typeFilter],
    queryFn: async () => {
      if (!organization) return [];

      let query = supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name");

      if (typeFilter && typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,cpf_cnpj.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const createContact = useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("contacts")
        .insert({
          organization_id: organization.id,
          type: formData.type,
          name: formData.name,
          cpf_cnpj: formData.cpf_cnpj || null,
          email: formData.email || null,
          phone: formData.phone || null,
          whatsapp: formData.whatsapp || null,
          city: formData.city || null,
          state: formData.state || null,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contato cadastrado com sucesso!");
      setDialogOpen(false);
      setFormData({
        type: "PF",
        name: "",
        cpf_cnpj: "",
        email: "",
        phone: "",
        whatsapp: "",
        city: "",
        state: "",
        notes: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar contato");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }
    createContact.mutate();
  };

  const selectedContact = contacts?.find((c) => c.id === selectedContactId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contatos</h1>
          <p className="text-muted-foreground">Gerencie clientes e partes envolvidas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Contato</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData((p) => ({ ...p, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa Física</SelectItem>
                    <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder={formData.type === "PF" ? "Nome completo" : "Razão social"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">{formData.type === "PF" ? "CPF" : "CNPJ"}</Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData((p) => ({ ...p, cpf_cnpj: e.target.value }))}
                  placeholder={formData.type === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
                    placeholder="SP"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Anotações sobre o contato..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createContact.isPending}>
                  {createContact.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PF">Pessoa Física</SelectItem>
                <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !contacts || contacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-lg font-medium mb-1">Nenhum contato encontrado</p>
              <p className="text-muted-foreground mb-4">
                {search || typeFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Comece cadastrando seu primeiro contato"}
              </p>
              {!search && typeFilter === "all" && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Contato
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                          {contact.type === "PF" ? (
                            <Users className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">{contact.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {contact.type === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.cpf_cnpj || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                        {!contact.email && !contact.phone && "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.city || contact.state
                        ? `${contact.city || ""}${contact.city && contact.state ? " - " : ""}${contact.state || ""}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedContactId(contact.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Contact Detail Sheet */}
      <Sheet open={!!selectedContactId} onOpenChange={(open) => !open && setSelectedContactId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                {selectedContact?.type === "PF" ? (
                  <Users className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {selectedContact?.name}
            </SheetTitle>
          </SheetHeader>

          {selectedContact && (
            <div className="mt-6 space-y-6">
              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase">Informações</h3>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <Badge variant="outline">
                      {selectedContact.type === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
                    </Badge>
                  </div>
                  {selectedContact.cpf_cnpj && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {selectedContact.type === "PF" ? "CPF" : "CNPJ"}
                      </span>
                      <span>{selectedContact.cpf_cnpj}</span>
                    </div>
                  )}
                  {selectedContact.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">E-mail</span>
                      <span>{selectedContact.email}</span>
                    </div>
                  )}
                  {selectedContact.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone</span>
                      <span>{selectedContact.phone}</span>
                    </div>
                  )}
                  {(selectedContact.city || selectedContact.state) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Localização</span>
                      <span>
                        {selectedContact.city}
                        {selectedContact.city && selectedContact.state ? " - " : ""}
                        {selectedContact.state}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Cases */}
              <ContactLinkedCases contactId={selectedContact.id} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
