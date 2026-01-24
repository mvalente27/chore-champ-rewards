import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateKidLoginRequest {
  kidProfileId: string;
  username: string;
  password: string;
}

// Generate a 6-character family code from household ID
function generateFamilyCode(householdId: string): string {
  // Take first 6 alphanumeric characters, uppercase for readability
  return householdId.replace(/-/g, '').slice(0, 6).toUpperCase();
}

// Convert username to a fake email for Supabase Auth
function usernameToEmail(username: string, householdId: string): string {
  // Create a deterministic fake email from username + household
  // Format: username@household-short.chorequest.local
  const shortHouseholdId = householdId.slice(0, 8);
  return `${username}@${shortHouseholdId}.chorequest.local`;
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

    // Create admin client for user creation
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
        JSON.stringify({ error: "Only parents can create kid login credentials" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { kidProfileId, username, password }: CreateKidLoginRequest = await req.json();

    // Validate username
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({ error: "Username must be 3-20 lowercase letters, numbers, or underscores" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the kid profile exists and belongs to the same household
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

    if (kidProfile.user_id) {
      return new Response(
        JSON.stringify({ error: "This kid already has login credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate the fake email from username
    const fakeEmail = usernameToEmail(username, parentProfile.household_id);

    // Check if username is already taken in this household
    // We do this by checking if the email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailTaken = existingUsers?.users?.some(u => u.email === fakeEmail);
    
    if (emailTaken) {
      return new Response(
        JSON.stringify({ error: "This username is already taken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate family code from household ID
    const familyCode = generateFamilyCode(parentProfile.household_id);

    // Create the auth user for the kid
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password,
      email_confirm: true, // Auto-confirm for kids
      user_metadata: {
        name: kidProfile.name,
        profile_type: "kid",
        username: username,
        family_code: familyCode,
      },
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Link the auth user to the kid profile
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ user_id: authData.user.id })
      .eq("id", kidProfileId);

    if (updateError) {
      // Rollback: delete the created auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to link credentials to profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Created kid login: ${username} for profile ${kidProfileId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Login credentials created for ${kidProfile.name}`,
        username,
        familyCode,
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
