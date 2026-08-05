import QRCode from "npm:qrcode@1.5.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);
  const data = url.searchParams.get("data")?.trim() ?? "";
  const format = url.searchParams.get("format") ?? "svg";

  if (!data || data.length > 2048) {
    return new Response("Invalid QR payload", {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (format !== "svg") {
    return new Response("Only SVG format is supported", {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const svg = await QRCode.toString(data, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      width: 256,
      color: {
        dark: "#071B34",
        light: "#FFFFFF",
      },
    });

    return new Response(svg, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("QR generation failed", error);
    return new Response("QR generation failed", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
