import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

/** Status do fluxo de Petição Inicial */
export const PETICAO_STATUSES = [
  { value: "not_started", label: "Não iniciada", dot: "bg-red-500", badge: "bg-red-500/10 text-red-600 border-red-500/20" },
  { value: "drafting", label: "Em elaboração", dot: "bg-yellow-500", badge: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  { value: "waiting_docs", label: "Aguardando documento", dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "review", label: "Em revisão", dot: "bg-purple-500", badge: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { value: "ready", label: "Pronta para protocolo", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { value: "filed", label: "Protocolada", dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground border-border" },
  { value: "canceled", label: "Cancelada", dot: "bg-destructive", badge: "bg-destructive/10 text-destructive border-destructive/20" },
] as const;

/** Compatibilidade com status antigos do módulo anterior */
const LEGACY_STATUS_MAP: Record<string, string> = {
  new: "not_started",
  in_progress: "drafting",
  waiting_client: "waiting_docs",
  ready_to_file: "ready",
  filed: "filed",
  archived: "filed",
};

export function normalizeStatus(status: string | null | undefined) {
  if (!status) return "not_started";
  if (PETICAO_STATUSES.some((s) => s.value === status)) return status;
  return LEGACY_STATUS_MAP[status] || "not_started";
}

export function isClosedStatus(status: string | null | undefined) {
  const v = normalizeStatus(status);
  return v === "filed" || v === "canceled";
}

export function getPeticaoStatus(status: string | null | undefined) {
  const value = normalizeStatus(status);
  return PETICAO_STATUSES.find((s) => s.value === value)!;
}

export const ACTION_TYPES = [
  "Ação de Indenização",
  "Ação de Obrigação de Fazer",
  "Ação Trabalhista",
  "Ação Previdenciária",
  "Ação de Saúde",
  "Ação Bancária",
  "Ação de Família",
  "Outros",
];

/** Checklist padrão de documentos da petição inicial */
export const PETICAO_CHECKLIST = [
  { key: "documentos_pessoais", label: "Documentos pessoais" },
  { key: "procuracao", label: "Procuração" },
  { key: "comprovante_endereco", label: "Comprovante de endereço" },
  { key: "provas", label: "Provas" },
] as const;

export type PeticaoChecklist = Record<string, boolean>;

export function checklistProgress(checklist: any) {
  const c = (checklist || {}) as PeticaoChecklist;
  const done = PETICAO_CHECKLIST.filter((i) => c[i.key]).length;
  return { done, total: PETICAO_CHECKLIST.length };
}

export interface Peticao {
  id: string;
  organization_id: string;
  title: string;
  client_name: string | null;
  action_type: string | null;
  assigned_member_id: string;
  status: string;
  priority: number | null;
  facts: string | null;
  case_description: string | null;
  notes: string | null;
  drive_link: string | null;
  process_number: string | null;
  tribunal: string | null;
  comarca: string | null;
  filed_at: string | null;
  checklist?: PeticaoChecklist | null;
  kanban_order?: number | null;
  created_at: string;
  updated_at: string;
  team_members?: { id: string; name: string } | null;
}

export function usePeticoes() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["peticoes", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("service_requests")
        .select(`*, team_members:assigned_member_id (id, name)`)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Peticao[];
    },
    enabled: !!organization,
  });
}

export function usePeticaoHistory(id: string | undefined) {
  return useQuery({
    queryKey: ["peticao-history", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("service_timeline_events")
        .select("*")
        .eq("service_request_id", id)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });
}

async function logEvent(params: {
  organizationId: string;
  serviceRequestId: string;
  eventType: string;
  description: string;
}) {
  const { data: auth } = await supabase.auth.getUser();
  await supabase.from("service_timeline_events").insert({
    organization_id: params.organizationId,
    service_request_id: params.serviceRequestId,
    event_type: params.eventType,
    description: params.description,
    created_by: auth.user?.id ?? null,
  });
}

export function useCreatePeticao() {
  const { data: organization } = useOrganization();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      client_name: string;
      action_type: string;
      assigned_member_id: string;
      facts?: string;
      drive_link?: string;
      notes?: string;
    }) => {
      if (!organization) throw new Error("Organização não encontrada");
      const title = `${input.client_name}${input.action_type ? ` — ${input.action_type}` : ""}`;
      const { data, error } = await supabase
        .from("service_requests")
        .insert({
          organization_id: organization.id,
          title,
          client_name: input.client_name,
          action_type: input.action_type || null,
          service_type: "peticao_inicial",
          assigned_member_id: input.assigned_member_id,
          status: "not_started",
          facts: input.facts || null,
          case_description: input.facts || "",
          drive_link: input.drive_link || null,
          notes: input.notes || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      await logEvent({
        organizationId: organization.id,
        serviceRequestId: data.id,
        eventType: "created",
        description: `Ação criada para ${input.client_name}.`,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["peticoes"] });
      toast.success("Ação criada!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar ação"),
  });
}

export function useUpdatePeticao() {
  const { data: organization } = useOrganization();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      values,
      logs,
    }: {
      id: string;
      values: Record<string, any>;
      logs?: { eventType: string; description: string }[];
    }) => {
      const { error } = await supabase.from("service_requests").update(values).eq("id", id);
      if (error) throw error;
      if (organization && logs?.length) {
        for (const l of logs) {
          await logEvent({
            organizationId: organization.id,
            serviceRequestId: id,
            eventType: l.eventType,
            description: l.description,
          });
        }
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["peticoes"] });
      qc.invalidateQueries({ queryKey: ["peticao-history", vars.id] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });
}

/** Troca a posição de duas petições dentro da mesma coluna do Kanban */
export function useReorderPeticao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ a, b }: { a: { id: string; order: number }; b: { id: string; order: number } }) => {
      const { error: e1 } = await supabase.from("service_requests").update({ kanban_order: b.order }).eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("service_requests").update({ kanban_order: a.order }).eq("id", b.id);
      if (e2) throw e2;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["peticoes"] }),
    onError: (e: any) => toast.error(e.message || "Erro ao reordenar"),
  });
}

export function useDeletePeticao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("service_timeline_events").delete().eq("service_request_id", id);
      const { error } = await supabase.from("service_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["peticoes"] });
      toast.success("Ação excluída");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao excluir"),
  });
}
