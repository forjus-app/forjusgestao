import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const action = body.action;

    if (action === "login") {
      return new Response(JSON.stringify({ error: "Use login via autenticação padrão do app." }), { status: 400, headers });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);

    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers });
    }

    const adminEmail = userData.user.email.trim().toLowerCase();

    const { data: adminCheck, error: adminCheckError } = await adminClient
      .from("saas_admins")
      .select("id")
      .eq("email", adminEmail)
      .maybeSingle();

    if (adminCheckError) {
      throw adminCheckError;
    }

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403, headers });
    }

    if (action === "list-users") {
      const { data: authUsers, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (listError) throw listError;

      const { data: profiles, error: profilesError } = await adminClient
        .from("profiles")
        .select("id, full_name, is_approved, organization_id, organizations(name)");

      if (profilesError) throw profilesError;

      const enrichedUsers = authUsers.users.map((user: any) => {
        const profile = profiles?.find((item: any) => item.id === user.id);
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
          full_name: profile?.full_name || user.user_metadata?.full_name || "",
          office_name: profile?.organizations?.name || user.user_metadata?.office_name || "",
          is_approved: profile?.is_approved ?? false,
          organization_id: profile?.organization_id,
        };
      });

      return new Response(JSON.stringify({ users: enrichedUsers }), { headers });
    }

    if (action === "approve-user") {
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ is_approved: Boolean(body.approved) })
        .eq("id", body.userId);

      if (updateError) throw updateError;
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (action === "update-user") {
      const updatePayload: Record<string, string> = {};
      if (body.email) updatePayload.email = String(body.email).trim().toLowerCase();
      if (body.password) updatePayload.password = String(body.password);

      if (Object.keys(updatePayload).length > 0) {
        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(body.userId, updatePayload);
        if (authUpdateError) throw authUpdateError;
      }

      if (body.full_name !== undefined) {
        const { error: profileUpdateError } = await adminClient
          .from("profiles")
          .update({ full_name: String(body.full_name ?? "") })
          .eq("id", body.userId);

        if (profileUpdateError) throw profileUpdateError;
      }

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (action === "delete-user") {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(body.userId);
      if (deleteError) throw deleteError;
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), { status: 500, headers });
  }
});
