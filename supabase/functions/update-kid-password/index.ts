import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateKidPasswordRequest {
  kidProfileId: string;
  newPassword: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    // Create client with user's auth to verify they're a parent
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Create admin client for user updates
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the requesting user's profile
    const { data: parentProfile, error: profileError } = await supabaseUser
      .from("profiles")
      .select("*")
      .eq("user_id", (await supabaseUser.auth.getUser()).data.user?.id)
      .single();

    if (profileError || !parentProfile) {
      return new Response(
        JSON.stringify({ error: "Could not verify parent profile" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (parentProfile.type !== "parent") {
      return new Response(
        JSON.stringify({ error: "Only parents can update kid passwords" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { kidProfileId, newPassword }: UpdateKidPasswordRequest = await req.json();

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the kid profile exists, belongs to the same household, and has credentials
    const { data: kidProfile, error: kidError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", kidProfileId)
      .eq("household_id", parentProfile.household_id)
      .eq("type", "kid")
      .single();

    if (kidError || !kidProfile) {
      return new Response(
        JSON.stringify({ error: "Kid profile not found or not in your household" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!kidProfile.user_id) {
      return new Response(
        JSON.stringify({ error: "This kid does not have login credentials yet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      kidProfile.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updated password for kid profile ${kidProfileId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Password updated for ${kidProfile.name}` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
