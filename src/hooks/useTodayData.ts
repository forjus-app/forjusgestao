import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { startOfDay, endOfDay, addDays } from "date-fns";

export function useTodayDeadlines(responsibleId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["today-deadlines", organization?.id, responsibleId],
    queryFn: async () => {
      if (!organization) return { overdue: [], today: [] };

      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      // Overdue: fatal_due_at < now AND status = open
      let overdueQuery = supabase
        .from("deadlines")
        .select(`
          *,
          team_members:responsible_member_id (id, name),
          cases:case_id (id, title, cnj_number)
        `)
        .eq("status", "open")
        .lt("fatal_due_at", todayStart)
        .order("fatal_due_at", { ascending: true })
        .limit(8);

      if (responsibleId && responsibleId !== "all") {
        overdueQuery = overdueQuery.eq("responsible_member_id", responsibleId);
      }

      // Today: delivery_due_at between start and end of today, status = open
      let todayQuery = supabase
        .from("deadlines")
        .select(`
          *,
          team_members:responsible_member_id (id, name),
          cases:case_id (id, title, cnj_number)
        `)
        .eq("status", "open")
        .gte("delivery_due_at", todayStart)
        .lte("delivery_due_at", todayEnd)
        .order("delivery_due_at", { ascending: true })
        .limit(8);

      if (responsibleId && responsibleId !== "all") {
        todayQuery = todayQuery.eq("responsible_member_id", responsibleId);
      }

      const [overdueResult, todayResult] = await Promise.all([
        overdueQuery,
        todayQuery,
      ]);

      if (overdueResult.error) throw overdueResult.error;
      if (todayResult.error) throw todayResult.error;

      return {
        overdue: overdueResult.data || [],
        today: todayResult.data || [],
      };
    },
    enabled: !!organization,
  });
}

export function useTodayEvents(responsibleId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["today-events", organization?.id, responsibleId],
    queryFn: async () => {
      if (!organization) return [];

      const now = new Date();
      const in7Days = addDays(now, 7);

      let query = supabase
        .from("events")
        .select(`
          *,
          team_members:responsible_member_id (id, name),
          cases:case_id (id, title, cnj_number)
        `)
        .eq("status", "scheduled")
        .gte("start_at", now.toISOString())
        .lte("start_at", in7Days.toISOString())
        .order("start_at", { ascending: true })
        .limit(8);

      if (responsibleId && responsibleId !== "all") {
        query = query.eq("responsible_member_id", responsibleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization,
  });
}

export function useTodayFollowups(responsibleId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["today-followups", organization?.id, responsibleId],
    queryFn: async () => {
      if (!organization) return { overdue: [], today: [] };

      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      let baseQuery = supabase
        .from("settlement_cases")
        .select(`
          *,
          case:cases(id, title, cnj_number),
          client_contact:contacts!settlement_cases_client_contact_id_fkey(id, name),
          counterparty_contact:contacts!settlement_cases_counterparty_contact_id_fkey(id, name),
          assigned_member:team_members!settlement_cases_assigned_member_id_fkey(id, name)
        `)
        .eq("organization_id", organization.id)
        .neq("status", "closed")
        .not("next_followup_at", "is", null);

      if (responsibleId && responsibleId !== "all") {
        baseQuery = baseQuery.eq("assigned_member_id", responsibleId);
      }

      const { data, error } = await baseQuery
        .order("next_followup_at", { ascending: true })
        .limit(16);

      if (error) throw error;

      const overdue = (data || []).filter(
        (s) => s.next_followup_at && s.next_followup_at < todayStart
      );
      const today = (data || []).filter(
        (s) =>
          s.next_followup_at &&
          s.next_followup_at >= todayStart &&
          s.next_followup_at <= todayEnd
      );

      return { overdue: overdue.slice(0, 8), today: today.slice(0, 8) };
    },
    enabled: !!organization,
  });
}

export function useTodayStats(responsibleId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["today-stats", organization?.id, responsibleId],
    queryFn: async () => {
      if (!organization) return null;

      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      // Overdue deadlines count
      let overdueQ = supabase
        .from("deadlines")
        .select("id", { count: "exact", head: true })
        .eq("status", "open")
        .lt("fatal_due_at", todayStart);

      // Today's deadlines count
      let todayQ = supabase
        .from("deadlines")
        .select("id", { count: "exact", head: true })
        .eq("status", "open")
        .gte("delivery_due_at", todayStart)
        .lte("delivery_due_at", todayEnd);

      // Upcoming events (7 days)
      let eventsQ = supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "scheduled")
        .gte("start_at", now.toISOString())
        .lte("start_at", addDays(now, 7).toISOString());

      if (responsibleId && responsibleId !== "all") {
        overdueQ = overdueQ.eq("responsible_member_id", responsibleId);
        todayQ = todayQ.eq("responsible_member_id", responsibleId);
        eventsQ = eventsQ.eq("responsible_member_id", responsibleId);
      }

      const [overdueR, todayR, eventsR] = await Promise.all([
        overdueQ,
        todayQ,
        eventsQ,
      ]);

      return {
        overdueDeadlines: overdueR.count || 0,
        todayDeadlines: todayR.count || 0,
        upcomingEvents: eventsR.count || 0,
      };
    },
    enabled: !!organization,
  });
}
