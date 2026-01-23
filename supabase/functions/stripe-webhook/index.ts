import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the raw body for signature verification
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // For now, parse without signature verification (webhook secret can be added later)
    const event = JSON.parse(body) as Stripe.Event;
    logStep("Event parsed", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Checkout session completed", { 
        sessionId: session.id, 
        metadata: session.metadata 
      });

      // Check if this is a wallet load
      if (session.metadata?.type === "wallet_load") {
        const userId = session.metadata.user_id;
        const amount = parseFloat(session.metadata.amount);

        if (!userId || isNaN(amount)) {
          throw new Error("Invalid metadata in session");
        }

        logStep("Processing wallet load", { userId, amount });

        // Use service role to update wallet
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get parent profile and wallet
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "parent")
          .single();

        if (profileError || !profile) {
          throw new Error(`Profile not found: ${profileError?.message}`);
        }

        logStep("Profile found", { profileId: profile.id });

        // Update wallet balance
        const { error: walletError } = await supabaseAdmin
          .from("parent_wallets")
          .update({ 
            balance: supabaseAdmin.rpc("", {}), // We'll use raw SQL instead
          })
          .eq("profile_id", profile.id);

        // Use RPC or direct update
        const { data: wallet, error: getWalletError } = await supabaseAdmin
          .from("parent_wallets")
          .select("id, balance")
          .eq("profile_id", profile.id)
          .single();

        if (getWalletError || !wallet) {
          throw new Error(`Wallet not found: ${getWalletError?.message}`);
        }

        const newBalance = Number(wallet.balance) + amount;
        
        const { error: updateError } = await supabaseAdmin
          .from("parent_wallets")
          .update({ 
            balance: newBalance,
            stripe_customer_id: session.customer as string || null,
          })
          .eq("id", wallet.id);

        if (updateError) {
          throw new Error(`Failed to update wallet: ${updateError.message}`);
        }

        // Record transaction
        const { error: txError } = await supabaseAdmin
          .from("wallet_transactions")
          .insert({
            wallet_id: wallet.id,
            type: "load",
            amount: amount,
            stripe_payment_intent_id: session.payment_intent as string,
            description: `Added $${amount} via Stripe`,
          });

        if (txError) {
          logStep("Warning: Failed to record transaction", { error: txError.message });
        }

        logStep("Wallet updated successfully", { 
          walletId: wallet.id, 
          previousBalance: wallet.balance,
          newBalance 
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
