// components/PromptList.js

<<<<<<< HEAD
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";  // Client‑Import statt API‑Fetch
=======
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { ClipboardCopyIcon } from "lucide-react";
>>>>>>> 31a200a34b49d20c84e4b6b610daac24793acab9

export function PromptList() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD

  useEffect(() => {
    // Direkt im Client abrufen
    const load = async () => {
=======
  const listRef = useRef();

  useEffect(() => {
    (async () => {
>>>>>>> 31a200a34b49d20c84e4b6b610daac24793acab9
      const { data, error } = await supabase
        .from("prompts")
        .select("id, prompt, response, created_at")
        .order("created_at", { ascending: false });
<<<<<<< HEAD
      if (error) {
        console.error("Fehler beim Laden der Prompts:", error);
      } else {
        setPrompts(data);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleExportMarkdown = () => {
    const md = prompts
      .map(
        (p) =>
          `---\n**Prompt:**\n\n${p.prompt}\n\n**Antwort:**\n\n${p.response}\n\n_Erstellt am: ${new Date(
            p.created_at
          ).toLocaleString()}_\n`
      )
      .join("\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompts.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
=======
      if (!error) setPrompts(data);
      setLoading(false);
    })();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Text kopiert!");
  };

  const handleExportMarkdown = () => {
    // … bleibt wie gehabt …
  };

  const handleExportPDF = async () => {
    // … bleibt wie gehabt …
>>>>>>> 31a200a34b49d20c84e4b6b610daac24793acab9
  };

  if (loading) return <p>Lade gespeicherte Prompts…</p>;
  if (prompts.length === 0) return <p>Noch keine Prompts gespeichert.</p>;

  return (
    <div className="mt-8">
<<<<<<< HEAD
      <button
        onClick={handleExportMarkdown}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
      >
        Export als Markdown
      </button>
      <div className="space-y-4">
        {prompts.map((entry) => (
          <div key={entry.id} className="p-4 border rounded">
            <p className="font-medium text-gray-800">Prompt:</p>
            <p className="mb-2">{entry.prompt}</p>
            <p className="font-medium text-gray-800">Antwort:</p>
            <p className="mb-1">{entry.response}</p>
            <p className="text-xs text-gray-500">
              Erstellt am: {new Date(entry.created_at).toLocaleString()}
            </p>
=======
      <div className="mb-4 flex space-x-2">
        <button
          onClick={handleExportMarkdown}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Export als Markdown
        </button>
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Export als PDF
        </button>
      </div>

      <div ref={listRef} className="space-y-6">
        {prompts.map(({ id, prompt, response, created_at }) => (
          <div
            key={id}
            className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(created_at).toLocaleString()}
              </span>
              <ClipboardCopyIcon
                className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600"
                onClick={() => handleCopy(prompt)}
                title="Prompt kopieren"
              />
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Prompt
              </h3>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {prompt}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Antwort
              </h3>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {response}
              </p>
            </div>
>>>>>>> 31a200a34b49d20c84e4b6b610daac24793acab9
          </div>
        ))}
      </div>
    </div>
  );
}
