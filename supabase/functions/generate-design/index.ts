import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fal } from "https://esm.sh/@fal-ai/client@1.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, style } = await req.json();

    if (!imageUrl || !style) {
      return new Response(
        JSON.stringify({ error: "Missing imageUrl or style" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured");
    }

    fal.config({
      credentials: FAL_KEY,
    });

    // Style prompts with architectural preservation and logical placement
    const stylePrompts: Record<string, string> = {
      modern: "Modern interior design with clean lines, neutral colors, contemporary furniture, minimalist decor, and natural lighting. IMPORTANT: Keep all windows, doors, and structural elements in their EXACT original positions. Place all furniture logically - sofas facing TVs, dining tables centered in space, beds against walls, desks near windows. Ensure TVs are mounted at eye level on appropriate walls. Professional staging photography.",
      traditional: "Traditional interior design with classic furniture, warm colors, elegant details, timeless decor, and sophisticated ambiance. IMPORTANT: Keep all windows, doors, and structural elements in their EXACT original positions. Place all furniture logically - sofas facing TVs, dining tables centered in space, beds against walls, desks near windows. Ensure TVs are mounted at eye level on appropriate walls. Professional staging photography.",
      minimalist: "Minimalist interior design with simple furniture, neutral palette, uncluttered space, functional pieces, and clean aesthetic. IMPORTANT: Keep all windows, doors, and structural elements in their EXACT original positions. Place all furniture logically - sofas facing TVs, dining tables centered in space, beds against walls, desks near windows. Ensure TVs are mounted at eye level on appropriate walls. Professional staging photography.",
      scandinavian: "Scandinavian interior design with light wood furniture, cozy textiles, natural elements, bright space, and hygge atmosphere. IMPORTANT: Keep all windows, doors, and structural elements in their EXACT original positions. Place all furniture logically - sofas facing TVs, dining tables centered in space, beds against walls, desks near windows. Ensure TVs are mounted at eye level on appropriate walls. Professional staging photography.",
      industrial: "Industrial interior design with exposed elements, metal accents, brick walls, urban aesthetic, and modern fixtures. IMPORTANT: Keep all windows, doors, and structural elements in their EXACT original positions. Place all furniture logically - sofas facing TVs, dining tables centered in space, beds against walls, desks near windows. Ensure TVs are mounted at eye level on appropriate walls. Professional staging photography.",
    };

    const prompt = stylePrompts[style] || stylePrompts.modern;

    console.log("Generating design with style:", style);

    const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
      input: {
        prompt: `Transform this empty room into a beautifully staged space. Preserve the exact room structure - keep windows, doors, walls, and architectural features in their original positions and sizes. Add furniture and decor with ${prompt}`,
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
