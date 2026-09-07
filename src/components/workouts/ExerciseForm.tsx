"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, Trash2, Upload, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createExerciseAction, updateExerciseAction, type WorkoutActionState } from "@/lib/actions/workouts.actions";
import { createClient } from "@/lib/supabase/client";
import { ExerciseVideoButton } from "./ExerciseVideoButton";
import { ExerciseVideoRecorder } from "./ExerciseVideoRecorder";
import type { Exercise } from "@/types/workout";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

function extensionFor(file: File) {
  return file.type === "video/mp4" ? "mp4" : "webm";
}

export function ExerciseForm({
  exercise,
  trainerId,
  onSuccess,
}: {
  exercise?: Exercise;
  trainerId: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<WorkoutActionState>({});
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [removeStoredVideo, setRemoveStoredVideo] = useState(false);

  function chooseVideo(file: File | null) {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setState({});
    if (!file) {
      setVideoFile(null);
      setVideoPreviewUrl(null);
      return;
    }
    if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
      setState({ error: "Use um vídeo MP4 ou WebM." });
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setState({ error: "O vídeo deve ter no máximo 50 MB." });
      return;
    }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setRemoveStoredVideo(false);
  }

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setState({});
    const formData = new FormData(event.currentTarget);
    const exerciseId = exercise?.id ?? crypto.randomUUID();
    formData.set("exercise_id", exerciseId);

    const supabase = createClient();
    let uploadedPath: string | null = null;

    try {
      if (videoFile) {
        const extension = extensionFor(videoFile);
        uploadedPath = `${trainerId}/${exerciseId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("exercise-videos")
          .upload(uploadedPath, videoFile, {
            contentType: videoFile.type,
            cacheControl: "3600",
            upsert: false,
          });
        if (uploadError) throw new Error(uploadError.message);
        formData.set("video_path", uploadedPath);
        formData.set("video_url", "");
      } else if (removeStoredVideo) {
        formData.set("video_path", "");
      } else {
        formData.set("video_path", exercise?.video_path ?? "");
      }

      const result = exercise
        ? await updateExerciseAction(exercise.id, {}, formData)
        : await createExerciseAction({}, formData);

      if (!result.success) {
        if (uploadedPath) await supabase.storage.from("exercise-videos").remove([uploadedPath]);
        setState(result);
        return;
      }

      if (exercise?.video_path && (uploadedPath || removeStoredVideo)) {
        await supabase.storage.from("exercise-videos").remove([exercise.video_path]);
      }

      showToast(exercise ? "Exercício atualizado." : "Exercício cadastrado.");
      router.refresh();
      onSuccess();
    } catch {
      if (uploadedPath) await supabase.storage.from("exercise-videos").remove([uploadedPath]);
      setState({ error: "Não foi possível enviar o vídeo. Verifique sua conexão e tente novamente." });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome do exercício"
          name="nome"
          required
          placeholder="Ex: Supino reto com barra"
          defaultValue={exercise?.nome ?? ""}
          error={state.fieldErrors?.nome}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Grupo muscular"
            name="grupo_muscular"
            placeholder="Ex: Peitoral"
            defaultValue={exercise?.grupo_muscular ?? ""}
          />
          <Input
            label="Equipamento"
            name="equipamento"
            placeholder="Ex: Barra e banco"
            defaultValue={exercise?.equipamento ?? ""}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
          <div>
            <p className="text-sm font-medium text-slate-800">Vídeo próprio do exercício</p>
            <p className="mt-1 text-xs text-slate-500">Grave pela câmera ou envie um MP4/WebM de até 50 MB. O arquivo ficará privado no Supabase Storage.</p>
          </div>

          {videoPreviewUrl ? (
            <div className="space-y-2">
              <video src={videoPreviewUrl} controls playsInline className="aspect-video w-full rounded-lg bg-black object-contain" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs text-slate-500">{videoFile?.name}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => chooseVideo(null)}>
                  <Trash2 className="h-3.5 w-3.5" /> Remover seleção
                </Button>
              </div>
            </div>
          ) : exercise?.video_path && !removeStoredVideo ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Video className="h-4 w-4" /> Vídeo próprio salvo
              </div>
              <div className="flex flex-wrap gap-2">
                <ExerciseVideoButton exerciseName={exercise.nome} videoPath={exercise.video_path} externalUrl={null} compact />
                <Button type="button" variant="ghost" size="sm" onClick={() => setRemoveStoredVideo(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Remover
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setRecorderOpen(true)}>
              <Camera className="h-4 w-4" /> Gravar agora
            </Button>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Enviar vídeo
            </Button>
            {removeStoredVideo && (
              <Button type="button" variant="ghost" onClick={() => setRemoveStoredVideo(false)}>
                Manter vídeo atual
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={(event) => chooseVideo(event.target.files?.[0] ?? null)}
          />
        </div>

        <Input
          label="Link externo de referência"
          name="video_url"
          type="url"
          placeholder="https://youtube.com/..."
          defaultValue={exercise?.video_url ?? ""}
          hint={exercise?.video_path && !removeStoredVideo && !videoFile
            ? "O vídeo próprio tem prioridade. Remova-o acima se quiser usar somente o link externo."
            : "Opcional. YouTube abre dentro do site; outras referências podem exigir abertura externa."}
        />

        <Textarea
          label="Instruções"
          name="instrucoes"
          placeholder="Descreva execução, postura e cuidados..."
          defaultValue={exercise?.instrucoes ?? ""}
        />

        {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

        <div className="flex justify-end pt-1">
          <Button type="submit" loading={pending}>
            {exercise ? "Salvar alterações" : "Cadastrar exercício"}
          </Button>
        </div>
      </form>

      <ExerciseVideoRecorder
        open={recorderOpen}
        onClose={() => setRecorderOpen(false)}
        onRecorded={chooseVideo}
      />
    </>
  );
}
