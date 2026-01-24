import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LookupRequest {
  username: string;
  familyCode: string;
}

// Generate family code from household ID (must match client-side logic)
function generateFamilyCode(householdId: string): string {
  return householdId.replace(/-/g, '').slice(0, 6).toUpperCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { username, familyCode }: LookupRequest = await req.json();

    console.log(`Looking up kid login attempt`);

    // Server-side validation - username format
    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate username format (3-20 lowercase letters, numbers, or underscores)
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side validation - family code format (exactly 6 alphanumeric)
    if (!familyCode || typeof familyCode !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const familyCodeRegex = /^[A-Za-z0-9]{6}$/;
    if (!familyCodeRegex.test(familyCode)) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Search for users with this username in their metadata
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("Error listing users:", error);
      return new Response(
        JSON.stringify({ error: "Failed to lookup user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find users with matching username in metadata
    const matchingUsers = users.users.filter(
      (u) => u.user_metadata?.username?.toLowerCase() === username.toLowerCase()
    );

    console.log(`Found ${matchingUsers.length} users with username: ${username}`);

    if (matchingUsers.length === 0) {
      // Use generic error message to prevent username enumeration
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For each matching user, look up their profile to get household_id
    // and verify the family code matches
    for (const user of matchingUsers) {
      // Get the profile for this auth user
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('household_id, name')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        console.log(`No profile found for user ${user.id}, skipping`);
        continue;
      }

      // Derive the family code from the household ID
      const derivedFamilyCode = generateFamilyCode(profile.household_id);
      console.log(`User ${user.id} has derived family code: ${derivedFamilyCode}`);

      if (derivedFamilyCode === familyCode.toUpperCase()) {
        // Match found!
        console.log(`Match found! User: ${user.email}`);
        return new Response(
          JSON.stringify({ 
            email: user.email,
            name: profile.name || user.user_metadata?.name 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // No matching user found with correct family code - use generic error to prevent enumeration
    console.log("No user found with matching credentials");
    return new Response(
      JSON.stringify({ error: "Invalid credentials" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
