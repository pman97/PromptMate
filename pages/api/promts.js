// pages/api/prompts.js

import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  // Nur GET-Anfragen zulassen
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Nur GET erlaubt" });
  }

  try {
    // Session-Check via Cookie (falls du Supabase-Session-Cookie nutzt)
    // Ansonsten musst du den userId-Header oder Ähnliches übergeben.
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: "Nicht eingeloggt" });
    }

    // Alle Prompts für den eingeloggten Nutzer abrufen
    const { data, error } = await supabase
      .from("prompts")
      .select("id, prompt, response, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ prompts: data });
  } catch (err) {
    console.error("API /prompts Error:", err);
    return res.status(500).json({ error: err.message || "Server‑Error" });
  }
}
