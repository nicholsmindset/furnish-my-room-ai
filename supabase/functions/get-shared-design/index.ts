import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ error: "Share token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token format (alphanumeric, 16 chars)
    if (!/^[A-Za-z0-9]{16}$/.test(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid share token format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch shared design with generation data
    const { data: sharedDesign, error: fetchError } = await supabaseClient
      .from("shared_designs")
      .select(`
        id,
        share_token,
        expires_at,
        is_public,
        views_count,
        created_at,
        generation:design_generations (
          id,
          original_image_url,
          generated_image_url,
          style,
          room_type,
          created_at
        )
      `)
      .eq("share_token", token)
      .single();

    if (fetchError || !sharedDesign) {
      return new Response(
        JSON.stringify({ error: "Shared design not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    if (sharedDesign.expires_at && new Date(sharedDesign.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This share link has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment view count (fire and forget)
    supabaseClient
      .from("shared_designs")
      .update({ views_count: (sharedDesign.views_count || 0) + 1 })
      .eq("id", sharedDesign.id)
      .then(() => {})
      .catch((err) => console.error("Failed to increment view count:", err));

    return new Response(
      JSON.stringify({
        design: {
          originalImageUrl: sharedDesign.generation?.original_image_url,
          generatedImageUrl: sharedDesign.generation?.generated_image_url,
          style: sharedDesign.generation?.style,
          roomType: sharedDesign.generation?.room_type,
          createdAt: sharedDesign.generation?.created_at,
        },
        share: {
          createdAt: sharedDesign.created_at,
          expiresAt: sharedDesign.expires_at,
          viewsCount: sharedDesign.views_count,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching shared design:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch shared design" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
