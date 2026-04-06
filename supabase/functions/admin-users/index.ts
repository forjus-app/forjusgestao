import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For admin login, we check credentials differently
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Admin login - verify email is in saas_admins table
    if (action === "login") {
      const { email, password } = await req.json();
      
      // Try to sign in
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        return new Response(JSON.stringify({ error: "Credenciais inválidas" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user is admin
      const { data: adminRecord, error: adminError } = await supabaseAdmin
        .from("saas_admins")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      console.log("Admin check:", { email, adminRecord, adminError });

      if (!adminRecord) {
        return new Response(JSON.stringify({ error: "Acesso negado. Você não é administrador.", debug: { email, adminError } }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        session: signInData.session,
        user: signInData.user 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For all other actions, verify JWT and admin status
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin
    const { data: adminCheck } = await supabaseAdmin
      .from("saas_admins")
      .select("id")
      .eq("email", user.email!)
      .maybeSingle();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle actions
    if (action === "list-users") {
      // List all auth users with their profiles and organizations
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });

      if (listError) throw listError;

      // Get all profiles with org info
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

      return new Response(JSON.stringify({ users: enrichedUsers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "approve-user") {
      const { userId, approved } = await req.json();

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ is_approved: approved })
        .eq("id", userId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update-user") {
      const { userId, email, password, full_name } = await req.json();

      // Update auth user
      const updatePayload: any = {};
      if (email) updatePayload.email = email;
      if (password) updatePayload.password = password;

      if (Object.keys(updatePayload).length > 0) {
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updatePayload);
        if (authUpdateError) throw authUpdateError;
      }

      // Update profile name
      if (full_name !== undefined) {
        await supabaseAdmin
          .from("profiles")
          .update({ full_name })
          .eq("id", userId);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete-user") {
      const { userId } = await req.json();

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
