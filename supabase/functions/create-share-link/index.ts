import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate cryptographically secure random share token
function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const tokenLength = 16; // Increased from 12 for better security
  const randomValues = new Uint8Array(tokenLength);
  crypto.getRandomValues(randomValues);

  let token = '';
  for (let i = 0; i < tokenLength; i++) {
    token += chars.charAt(randomValues[i] % chars.length);
  }
  return token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { generationId, expiresInDays } = await req.json();
    
    if (!generationId) {
      throw new Error("Generation ID is required");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user owns this generation
    const { data: generation, error: genError } = await supabaseClient
      .from("design_generations")
      .select("user_id")
      .eq("id", generationId)
      .single();

    if (genError || !generation) {
      throw new Error("Generation not found");
    }

    if (generation.user_id !== user.id) {
      throw new Error("Unauthorized");
    }

    // Check if share already exists
    const { data: existingShare } = await supabaseClient
      .from("shared_designs")
      .select("share_token")
      .eq("generation_id", generationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingShare) {
      return new Response(JSON.stringify({ 
        shareToken: existingShare.share_token,
        shareUrl: `${req.headers.get("origin")}/share/${existingShare.share_token}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create new share
    const shareToken = generateShareToken();
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { error: shareError } = await supabaseClient
      .from("shared_designs")
      .insert({
        generation_id: generationId,
        user_id: user.id,
        share_token: shareToken,
        expires_at: expiresAt,
      });

    if (shareError) throw shareError;

    return new Response(JSON.stringify({ 
      shareToken,
      shareUrl: `${req.headers.get("origin")}/share/${shareToken}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("ERROR in create-share-link", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
