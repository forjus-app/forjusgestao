import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

export interface DeadlineTag {
  id: string;
  name: string;
  color: string | null;
}

export function useDeadlineTags() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["deadline-tags", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deadline_tags")
        .select("id, name, color")
        .order("name");
      if (error) throw error;
      return (data || []) as DeadlineTag[];
    },
    enabled: !!organization?.id,
  });
}

/** Map of deadline_id -> tags */
export function useDeadlineTagLinks() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["deadline-tag-links", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deadline_tag_links")
        .select("deadline_id, tag_id, deadline_tags:tag_id (id, name, color)");
      if (error) throw error;

      const map: Record<string, DeadlineTag[]> = {};
      (data || []).forEach((row: any) => {
        if (!row.deadline_tags) return;
        if (!map[row.deadline_id]) map[row.deadline_id] = [];
        map[row.deadline_id].push(row.deadline_tags as DeadlineTag);
      });
      Object.values(map).forEach((tags) => tags.sort((a, b) => a.name.localeCompare(b.name)));
      return map;
    },
    enabled: !!organization?.id,
  });
}

export function useCreateDeadlineTag() {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string | null }) => {
      if (!organization?.id) throw new Error("Organização não encontrada");
      const { data, error } = await supabase
        .from("deadline_tags")
        .insert({ organization_id: organization.id, name: name.trim(), color })
        .select("id, name, color")
        .single();
      if (error) throw error;
      return data as DeadlineTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadline-tags"] });
    },
  });
}

/** Replaces the tag links of a deadline with the given tag ids */
export async function saveDeadlineTagLinks(
  organizationId: string,
  deadlineId: string,
  tagIds: string[]
) {
  const { data: existing, error: readError } = await supabase
    .from("deadline_tag_links")
    .select("id, tag_id")
    .eq("deadline_id", deadlineId);
  if (readError) throw readError;

  const currentIds = (existing || []).map((r: any) => r.tag_id);
  const toAdd = tagIds.filter((id) => !currentIds.includes(id));
  const toRemove = (existing || []).filter((r: any) => !tagIds.includes(r.tag_id));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("deadline_tag_links")
      .delete()
      .in("id", toRemove.map((r: any) => r.id));
    if (error) throw error;
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from("deadline_tag_links").insert(
      toAdd.map((tagId) => ({
        organization_id: organizationId,
        deadline_id: deadlineId,
        tag_id: tagId,
      }))
    );
    if (error) throw error;
  }
}
