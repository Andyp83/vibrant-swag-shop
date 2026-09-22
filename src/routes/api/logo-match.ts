import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Looks at an uploaded logo or design and recommends merchandise from our ranges.
 * Streams from the AI gateway server-side and returns the finished JSON to the app.
 */
const requestSchema = z.object({
  image: z
    .string()
    .min(50)
    .max(8_000_000)
    .refine((v) => /^data:image\/(png|jpe?g|webp);base64,/.test(v), "Unsupported image type"),
  brief: z.string().trim().max(1000).optional().or(z.literal("")),
  categories: z.array(z.string().trim().min(1).max(80)).min(1).max(40),
});

const recommendationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["palette", "style", "logo_notes", "recommendations"],
  properties: {
    palette: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "hex"],
        properties: {
          name: { type: "string" },
          hex: { type: "string" },
        },
      },
    },
    style: { type: "string" },
    logo_notes: { type: "string" },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "product", "why", "decoration", "colour"],
        properties: {
          category: { type: "string" },
          product: { type: "string" },
          why: { type: "string" },
          decoration: { type: "string" },
          colour: { type: "string" },
        },
      },
    },
  },
} as const;

export const Route = createFileRoute("/api/logo-match")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json(
            { error: "Product matching is not configured yet." },
            { status: 500 },
          );
        }

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const parsed = requestSchema.safeParse(payload);
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid request." },
            { status: 400 },
          );
        }

        const { image, brief, categories } = parsed.data;
        const runId = request.headers.get("X-Lovable-AIG-Run-ID")?.trim();

        const instructions = [
          "You are a senior branded-merchandise consultant for an Australian promotional merchandise studio.",
          "Look at the uploaded logo or design and recommend six to eight promotional merchandise items that will carry it well.",
          `Only use these product categories, copied exactly: ${categories.join(", ")}.`,
          "For each recommendation give the category, a specific product type, a one-sentence reason tied to what you can see in the artwork, a suitable decoration method (for example embroidery, pad print, laser engraving, screen print, full colour digital print) and a recommended product colour.",
          "Read the dominant colours out of the artwork and describe the visual style in one short sentence.",
          "In logo_notes, flag anything that affects decoration: fine detail, gradients, thin strokes, number of colours, or text that will not survive small print.",
          brief ? `The client adds: ${brief}` : "",
        ]
          .filter(Boolean)
          .join(" ");

        let gatewayResponse: Response;
        try {
          gatewayResponse = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": apiKey,
              "X-Lovable-AIG-SDK": "fetch",
              ...(runId ? { "X-Lovable-AIG-Run-ID": runId } : {}),
            },
            body: JSON.stringify({
              model: "openai/gpt-6-astra",
              stream: true,
              store: false,
              reasoning: { effort: "low" },
              input: [
                {
                  role: "user",
                  content: [
                    { type: "input_text", text: instructions },
                    { type: "input_image", image_url: image },
                  ],
                },
              ],
              text: {
                format: {
                  type: "json_schema",
                  name: "merch_recommendations",
                  strict: true,
                  schema: recommendationSchema,
                },
              },
            }),
          });
        } catch (error) {
          console.error("logo-match gateway request failed", error);
          return Response.json(
            { error: "We couldn't reach the matching service. Please try again." },
            { status: 502 },
          );
        }

        if (!gatewayResponse.ok || !gatewayResponse.body) {
          const detail = await gatewayResponse.text().catch(() => "");
          console.error("logo-match gateway error", gatewayResponse.status, detail.slice(0, 500));
          const message =
            gatewayResponse.status === 429
              ? "Lots of requests right now — please try again in a moment."
              : gatewayResponse.status === 402
                ? "AI credits for this workspace have run out."
                : "The matching service couldn't read that file. Please try another image.";
          return Response.json({ error: message }, { status: gatewayResponse.status });
        }

        const reader = gatewayResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let text = "";

        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const event = JSON.parse(data) as {
                type?: string;
                delta?: string;
                response?: { output_text?: string };
              };
              if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
                text += event.delta;
              } else if (event.type === "response.completed" && event.response?.output_text) {
                if (!text) text = event.response.output_text;
              }
            } catch {
              // ignore keep-alive and partial frames
            }
          }
        }

        if (!text.trim()) {
          return Response.json(
            { error: "No suggestions came back. Please try a clearer image of your logo." },
            { status: 502 },
          );
        }

        try {
          return Response.json(JSON.parse(text), {
            headers: { "Cache-Control": "no-store" },
          });
        } catch {
          console.error("logo-match unparseable output", text.slice(0, 500));
          return Response.json(
            { error: "We couldn't read the suggestions. Please try again." },
            { status: 502 },
          );
        }
      },
    },
  },
});
