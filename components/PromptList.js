// components/PromptList.js
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { ClipboardCopy } from "lucide-react";

export function PromptList() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef();

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("id, prompt, response, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fehler beim Laden der Prompts:", error);
      } else {
        setPrompts(data);
      }
      setLoading(false);
    };
    load();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch((e) => {
      console.warn("Kopieren fehlgeschlagen:", e);
    });
  };

  if (loading) return <p className="py-4">Lade gespeicherte Prompts...</p>;
  if (prompts.length === 0)
    return <p className="py-4 text-gray-500">Keine gespeicherten Prompts.</p>;

  return (
    <div ref={listRef} className="space-y-4">
      {prompts.map((p) => (
        <div
          key={p.id}
          className="border rounded p-4 bg-white shadow-sm flex flex-col gap-2"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium">Prompt:</p>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                {p.prompt}
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(p.prompt)}
              aria-label="Prompt kopieren"
              className="ml-2"
            >
              <ClipboardCopy size={20} />
            </button>
          </div>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium">Antwort:</p>
              <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
                {p.response}
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(p.response)}
              aria-label="Antwort kopieren"
              className="ml-2"
            >
              <ClipboardCopy size={20} />
            </button>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(p.created_at).toLocaleString("de-DE")}
          </div>
        </div>
      ))}
    </div>
  );
}
