// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import CryptoJS from "npm:crypto-js@4.2.0";

// Simple AES encryption using CryptoJS
function encryptData(data: object, encryptionKey: string) {
  const jsonStr = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonStr, encryptionKey).toString();
  return { cipherText: encrypted };
}

Deno.serve(async (req: Request) => {
  // CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: "No Auth Header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
        return new Response(JSON.stringify({ error: "Unauthorized", details: "Missing Environment Variables" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: userError } = await userClient.auth.getUser(jwt);

    if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized", details: userError?.message || "User not found" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const body = await req.json();
    const { 
      module_name, 
      exam_type, 
      sub_discipline, 
      cours, 
      year, 
      exam_year, 
      limit = 50, 
      offset = 0 
    } = body;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    let query = adminClient
      .from("questions")
      .select("*, answers(*)", { count: "exact" });

    if (module_name && module_name.trim() !== '') {
      query = query.eq('module_name', module_name);
    }
    if (exam_type && exam_type.trim() !== '') {
      query = query.eq('exam_type', exam_type);
    }
    if (sub_discipline && sub_discipline.trim() !== '') {
      query = query.eq('sub_discipline', sub_discipline);
    }
    if (cours && cours.trim() !== '') {
      query = query.contains('cours', [cours]);
    }
    if (year && year.toString().trim() !== '') {
      query = query.eq('year', year);
    }
    if (exam_year) {
      query = query.eq('exam_year', exam_year);
    }

    // Sorting to match client
    query = query
      .order('exam_year', { ascending: false })
      .order('exam_type', { ascending: true })
      .order('number', { ascending: true });

    // Pagination
    if (limit) {
      query = query.limit(limit);
    }
    if (offset !== undefined && offset !== null) {
      query = query.range(offset, offset + (limit || 20) - 1);
    }

    const { data: questions, count, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    await adminClient.from("security_audit_logs").insert({
      user_id: user.id,
      action: "fetch_secure_questions",
      resource_id: `module:${module_name || 'all'}|exam:${exam_type || 'all'}`,
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    const encryptionKey = Deno.env.get("SECRET_PAYLOAD_KEY") || "default_dev_key_change_in_prod!";
    
    // Return both questions correctly mapped and the count
    const encryptedResponse = encryptData({ data: questions || [], count: count || 0 }, encryptionKey);

    return new Response(JSON.stringify(encryptedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
