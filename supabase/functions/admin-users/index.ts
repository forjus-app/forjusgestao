import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const action = body.action;

    // Admin login - no JWT required
    if (action === "login") {
      const { email, password } = body;

      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return new Response(JSON.stringify({ error: "Credenciais inválidas" }), { status: 401, headers });
      }

      // Check if user is admin
      const { data: adminRecord, error: adminError } = await supabaseAdmin
        .from("saas_admins")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      console.log("Admin check:", JSON.stringify({ email, adminRecord, adminError }));

      if (!adminRecord) {
        return new Response(JSON.stringify({ error: "Acesso negado. Você não é administrador." }), { status: 403, headers });
      }

      return new Response(JSON.stringify({ session: signInData.session, user: signInData.user }), { headers });
    }

    // For all other actions, verify JWT and admin status
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers });
    }

    const { data: adminCheck } = await supabaseAdmin
      .from("saas_admins")
      .select("id")
      .eq("email", user.email!)
      .maybeSingle();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403, headers });
    }

    if (action === "list-users") {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (listError) throw listError;

      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, is_approved, organization_id, organizations(name)");

      const enrichedUsers = users.map((u: any) => {
        const profile = profiles?.find((p: any) => p.id === u.id);
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          email_confirmed_at: u.email_confirmed_at,
          full_name: profile?.full_name || u.user_metadata?.full_name || "",
          office_name: profile?.organizations?.name || u.user_metadata?.office_name || "",
          is_approved: profile?.is_approved ?? false,
          organization_id: profile?.organization_id,
        };
      });

      return new Response(JSON.stringify({ users: enrichedUsers }), { headers });
    }

    if (action === "approve-user") {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ is_approved: body.approved })
        .eq("id", body.userId);
      if (updateError) throw updateError;
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (action === "update-user") {
      const updatePayload: any = {};
      if (body.email) updatePayload.email = body.email;
      if (body.password) updatePayload.password = body.password;

      if (Object.keys(updatePayload).length > 0) {
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(body.userId, updatePayload);
        if (authUpdateError) throw authUpdateError;
      }

      if (body.full_name !== undefined) {
        await supabaseAdmin.from("profiles").update({ full_name: body.full_name }).eq("id", body.userId);
      }

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (action === "delete-user") {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(body.userId);
      if (deleteError) throw deleteError;
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
