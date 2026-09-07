"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";

function youtubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace(/^\//, "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return value;
      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function looksLikeDirectVideo(value: string) {
  try {
    const url = new URL(value);
    return /\.(mp4|webm)(?:$|\?)/i.test(`${url.pathname}${url.search}`);
  } catch {
    return false;
  }
}

export function ExerciseVideoButton({
  exerciseName,
  videoPath,
  externalUrl,
  compact = false,
}: {
  exerciseName: string;
  videoPath?: string | null;
  externalUrl?: string | null;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const youtubeUrl = useMemo(() => externalUrl ? youtubeEmbedUrl(externalUrl) : null, [externalUrl]);

  if (!videoPath && !externalUrl) return null;

  async function openVideo() {
    setError(null);
    if (videoPath) {
      setLoading(true);
      const supabase = createClient();
      const { data, error: signError } = await supabase.storage
        .from("exercise-videos")
        .createSignedUrl(videoPath, 15 * 60);
      setLoading(false);
      if (signError || !data?.signedUrl) {
        setError("Não foi possível carregar este vídeo agora.");
        setOpen(true);
        return;
      }
      setSignedUrl(data.signedUrl);
    }
    setOpen(true);
  }

  function closeVideo() {
    setOpen(false);
    setSignedUrl(null);
    setError(null);
  }

  const playerUrl = videoPath ? signedUrl : externalUrl;
  const directVideo = Boolean(videoPath || (playerUrl && looksLikeDirectVideo(playerUrl)));

  return (
    <>
      <button
        type="button"
        onClick={openVideo}
        disabled={loading}
        className={compact
          ? "mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-slate-800 hover:underline disabled:opacity-60"
          : "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
        {loading ? "Carregando..." : "Ver vídeo"}
      </button>

      <Modal open={open} onClose={closeVideo} title={exerciseName} description="Vídeo de referência do exercício" size="lg">
        <div className="space-y-4">
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          ) : playerUrl && directVideo ? (
            <div className="overflow-hidden rounded-xl bg-black">
              <video src={playerUrl} controls playsInline preload="metadata" className="aspect-video w-full object-contain" />
            </div>
          ) : youtubeUrl ? (
            <div className="overflow-hidden rounded-xl bg-black">
              <iframe
                src={youtubeUrl}
                title={`Vídeo de ${exerciseName}`}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : externalUrl ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-sm text-slate-600">Esta referência externa não permite reprodução incorporada no site.</p>
              <a href={externalUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex">
                <Button type="button" variant="outline">
                  Abrir referência <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
