import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fal } from "https://esm.sh/@fal-ai/client@1.1.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  try {
    const { imageUrl, style, roomType } = await req.json();

    // Validate required parameters exist
    if (!imageUrl || !style || !roomType) {
      return new Response(
        JSON.stringify({ error: "Missing imageUrl, style, or roomType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate style against allowed values
    const ALLOWED_STYLES = ['modern', 'traditional', 'minimalist', 'scandinavian', 'industrial'];
    if (!ALLOWED_STYLES.includes(style)) {
      return new Response(
        JSON.stringify({ error: "Invalid style. Must be one of: modern, traditional, minimalist, scandinavian, industrial" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate roomType against allowed values
    const ALLOWED_ROOM_TYPES = ['living-room', 'bedroom', 'kitchen', 'dining-room', 'bathroom', 'office', 'outdoor'];
    if (!ALLOWED_ROOM_TYPES.includes(roomType)) {
      return new Response(
        JSON.stringify({ error: "Invalid room type. Must be one of: living-room, bedroom, kitchen, dining-room, bathroom, office, outdoor" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate imageUrl is a proper data URL
    if (!imageUrl.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({ error: "Invalid image format. Must be a base64 data URL starting with 'data:image/'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate image size (max 10MB base64)
    const imageSize = imageUrl.length;
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageSize > maxSize) {
      return new Response(
        JSON.stringify({ error: "Image too large. Maximum size is 10MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authentication is now required - get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;

    // Rate limiting: 1 request per 5 seconds per user
    const rateLimit = checkRateLimit(`generate:${userId}`, { windowMs: 5000, maxRequests: 1 });
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a few seconds." }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            ...getRateLimitHeaders(rateLimit),
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Check and deduct credits
    // Check current credits
    const { data: creditsData, error: creditsError } = await supabaseClient
      .from("user_credits")
      .select("credits_remaining")
      .eq("user_id", userId)
      .single();

    if (creditsError || !creditsData) {
      return new Response(
        JSON.stringify({ error: "Failed to check credits" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (creditsData.credits_remaining < 1) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits. Please upgrade your plan." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct credit using database function
    const { data: deductSuccess, error: deductError } = await supabaseClient.rpc(
      "deduct_credits",
      { _user_id: userId, _credits_cost: 1 }
    );

    if (deductError || !deductSuccess) {
      return new Response(
        JSON.stringify({ error: "Failed to deduct credits" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log usage
    await supabaseClient.from("usage_logs").insert({
      user_id: userId,
      action_type: "design_generation",
      credits_cost: 1,
      metadata: { style, room_type: roomType },
    });

    // Check if credits are low (5 or less) and send email
    const { data: updatedCredits } = await supabaseClient
      .from("user_credits")
      .select("credits_remaining")
      .eq("user_id", userId)
      .single();

    if (updatedCredits && updatedCredits.credits_remaining <= 5) {
      // Get user email and subscription info from profiles
      const { data: profileData } = await supabaseClient
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();

      const { data: subData } = await supabaseClient
        .from("user_subscriptions")
        .select("subscription_tier")
        .eq("user_id", userId)
        .single();

      if (profileData?.email) {
        try {
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              type: "credits_low",
              email: profileData.email,
              data: {
                userName: profileData.email.split("@")[0],
                creditsRemaining: updatedCredits.credits_remaining,
                planName: subData?.subscription_tier || "Free",
              },
            }),
          });
        } catch (emailError) {
          console.error("Failed to send low credits email:", emailError);
        }
      }
    }

    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured");
    }

    fal.config({
      credentials: FAL_KEY,
    });

    // Enhanced style prompts with architectural preservation and logical placement
    const stylePrompts: Record<string, string> = {
      modern: "Ultra-modern interior design with sleek geometric furniture, monochromatic color palette with metallic accents, floor-to-ceiling windows, recessed LED lighting, polished concrete or light hardwood floors, abstract art pieces, and designer fixtures. Features clean horizontal lines, floating shelves, glass coffee tables, and statement lighting. High-end contemporary staging with premium materials.",
      traditional: "Elegant traditional interior design with rich wood furniture (mahogany, cherry, oak), ornate details and crown molding, Persian or Oriental rugs, crystal chandeliers, silk or velvet upholstery in jewel tones, classic oil paintings in gilded frames, antique accent pieces, table lamps with fabric shades, and symmetrical furniture arrangements. Timeless sophistication with layered textures.",
      minimalist: "Japanese-inspired minimalist design with low-profile furniture, pure white walls, natural light maximization, hidden storage solutions, single statement plant (monstera or fiddle leaf fig), neutral color palette (whites, beiges, soft grays), uncluttered surfaces, simple geometric shapes, natural materials (light wood, linen, cotton), and zen-like serenity. Less is more philosophy with intentional negative space.",
      scandinavian: "Scandinavian hygge design with blonde wood furniture (birch, ash, pine), sheepskin throws, chunky knit textiles, ceramic pottery, pendant lighting with warm bulbs, indoor plants, neutral base with pastel accents, functional storage baskets, cozy reading nooks, natural fiber rugs, and emphasis on comfort and warmth. Bright, airy spaces with organic shapes.",
      industrial: "Urban industrial loft design with exposed brick walls, visible ductwork and pipes, Edison bulb lighting fixtures, metal and reclaimed wood furniture, leather seating, concrete floors, steel-framed windows, vintage factory-inspired pieces, metal shelving units, and warm amber lighting to soften the raw aesthetic. Modern warehouse conversion vibe with character.",
    };

    const roomTypeContext: Record<string, string> = {
      "living-room": "Focus on seating arrangements around a focal point (TV, fireplace, or window view). Include a sofa, accent chairs, coffee table, side tables, area rug, and entertainment center. Ensure proper conversation distance and traffic flow.",
      "bedroom": "Center the bed against the main wall (never blocking windows). Include nightstands on both sides, dresser, optional seating area, bedside lamps, artwork above bed, and soft textiles. Create a restful, symmetrical layout.",
      "kitchen": "Maintain the existing cabinetry and appliance positions. Add bar stools if there's an island, pendant lighting, decorative backsplash accents, fresh flowers or fruit bowl, and small appliances. Keep counters mostly clear for a clean look.",
      "dining-room": "Center the dining table in the space with chairs (6-8 for standard rooms). Add a statement chandelier or pendant light centered above the table, sideboard or buffet against a wall, area rug under the table, and a centerpiece. Ensure comfortable walking space around the table.",
      "bathroom": "Preserve all existing fixtures (toilet, sink, tub/shower). Add plush towels, bath mat, decorative containers, mirrors with good lighting, small plants, and spa-like accessories. Create a hotel-bathroom aesthetic.",
      "office": "Position desk near natural light source. Include an ergonomic chair, bookshelf, desk lamp, organized storage, minimal desk accessories, inspirational artwork, and possibly a small seating area. Professional yet personal workspace.",
      "outdoor": "Design appropriate patio or deck furniture arrangements. Include seating areas with weather-resistant furniture, outdoor rugs, planters with greenery, string lights or lanterns, and create defined entertaining zones.",
    };

    const roomContext = roomTypeContext[roomType] || roomTypeContext["living-room"];
    const stylePrompt = stylePrompts[style] || stylePrompts.modern;
    
    const prompt = `${stylePrompt} ROOM TYPE: ${roomType}. ${roomContext} CRITICAL REQUIREMENTS: Keep all windows, doors, walls, and architectural features in their EXACT original positions and sizes. No structural changes whatsoever. Professional real estate staging photography, 8K quality, natural daylight, shot with wide-angle lens.`;

    console.log("Generating design with style:", style, "and room type:", roomType);

    const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
      input: {
        prompt: `Transform this empty ${roomType.replace('-', ' ')} into a beautifully staged space. ${prompt}`,
        num_images: 1,
        aspect_ratio: "auto",
        output_format: "png",
        image_urls: [imageUrl],
        resolution: "1K",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Status:", update.status);
          if (update.logs) {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        }
      },
    });

    console.log("Generation complete");

    const imageResult = result.data?.images?.[0];
    if (!imageResult?.url) {
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({ imageUrl: imageResult.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate design";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
