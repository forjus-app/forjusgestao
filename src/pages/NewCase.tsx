import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function NewCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  const [formData, setFormData] = useState({
    title: "",
    cnj_number: "",
    status_id: "",
    phase_id: "",
    area_id: "",
    type_id: "",
    tribunal: "",
    court: "",
    court_division: "",
    city: "",
    state: "",
    link_url: "",
    pending_notes: "",
    claim_value: "",
  });

  // Fetch taxonomies
  const { data: statuses } = useQuery({
    queryKey: ["case-statuses", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data } = await supabase
        .from("case_statuses")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!organization,
  });

  const { data: phases } = useQuery({
    queryKey: ["case-phases", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data } = await supabase
        .from("case_phases")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!organization,
  });

  const { data: areas } = useQuery({
    queryKey: ["case-areas", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data } = await supabase
        .from("case_areas")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!organization,
  });

  const { data: types } = useQuery({
    queryKey: ["case-types", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data } = await supabase
        .from("case_types")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!organization,
  });

  const createCase = useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error("Organização não encontrada");

      const defaultStatus = statuses?.find((s) => s.is_default) || statuses?.[0];

      const { data, error } = await supabase
        .from("cases")
        .insert({
          organization_id: organization.id,
          title: formData.title,
          cnj_number: formData.cnj_number || null,
          status_id: formData.status_id || defaultStatus?.id || null,
          phase_id: formData.phase_id || null,
          area_id: formData.area_id || null,
          type_id: formData.type_id || null,
          tribunal: formData.tribunal || null,
          court: formData.court || null,
          court_division: formData.court_division || null,
          city: formData.city || null,
          state: formData.state || null,
          link_url: formData.link_url || null,
          pending_notes: formData.pending_notes || null,
          claim_value: formData.claim_value ? parseFloat(formData.claim_value) : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Processo cadastrado com sucesso!");
      navigate(`/cases/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar processo");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }
    createCase.mutate();
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/cases">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Processo</h1>
          <p className="text-muted-foreground">Cadastre um novo processo judicial</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados essenciais do processo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Título do Processo *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Ação de Indenização - João vs. Empresa X"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnj_number">Número CNJ</Label>
                <Input
                  id="cnj_number"
                  placeholder="0000000-00.0000.0.00.0000"
                  value={formData.cnj_number}
                  onChange={(e) => handleChange("cnj_number", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_url">Link do Processo</Label>
                <Input
                  id="link_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.link_url}
                  onChange={(e) => handleChange("link_url", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classification */}
        <Card>
          <CardHeader>
            <CardTitle>Classificação</CardTitle>
            <CardDescription>Status, fase e área do processo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status_id}
                  onValueChange={(v) => handleChange("status_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses?.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fase</Label>
                <Select
                  value={formData.phase_id}
                  onValueChange={(v) => handleChange("phase_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases?.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Área</Label>
                <Select
                  value={formData.area_id}
                  onValueChange={(v) => handleChange("area_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas?.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type_id}
                  onValueChange={(v) => handleChange("type_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {types?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Localização</CardTitle>
            <CardDescription>Tribunal e comarca do processo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="tribunal">Tribunal</Label>
                <Input
                  id="tribunal"
                  placeholder="TJSP, TRF3..."
                  value={formData.tribunal}
                  onChange={(e) => handleChange("tribunal", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="court">Comarca/Foro</Label>
                <Input
                  id="court"
                  placeholder="São Paulo"
                  value={formData.court}
                  onChange={(e) => handleChange("court", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="court_division">Vara</Label>
                <Input
                  id="court_division"
                  placeholder="1ª Vara Cível"
                  value={formData.court_division}
                  onChange={(e) => handleChange("court_division", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="claim_value">Valor da Causa</Label>
                <Input
                  id="claim_value"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.claim_value}
                  onChange={(e) => handleChange("claim_value", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  placeholder="São Paulo"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  placeholder="SP"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Anotações gerais sobre o processo..."
              value={formData.pending_notes}
              onChange={(e) => handleChange("pending_notes", e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link to="/cases">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={createCase.isPending}>
            {createCase.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Processo
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
