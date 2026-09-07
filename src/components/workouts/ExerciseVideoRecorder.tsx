"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CircleStop, RotateCcw, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const MAX_RECORDING_SECONDS = 90;

function recordingFormat() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/mp4",
    "video/webm",
  ];
  const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "";
  const isMp4 = mimeType.startsWith("video/mp4");
  return {
    mimeType,
    contentType: isMp4 ? "video/mp4" : "video/webm",
    extension: isMp4 ? "mp4" : "webm",
  };
}

function cameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "O navegador bloqueou o acesso à câmera. Libere a câmera nas permissões deste site e tente novamente.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "Nenhuma câmera foi encontrada neste dispositivo.";
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "A câmera está sendo usada por outro aplicativo ou não pôde ser iniciada.";
    }
    if (error.name === "OverconstrainedError") {
      return "A câmera disponível não atende à configuração solicitada.";
    }
  }
  return "Não foi possível acessar a câmera. Verifique a permissão do navegador e tente novamente.";
}

export function ExerciseVideoRecorder({
  open,
  onClose,
  onRecorded,
}: {
  open: boolean;
  onClose: () => void;
  onRecorded: (file: File) => void;
}) {
  const cameraRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [requestingCamera, setRequestingCamera] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
    if (cameraRef.current) cameraRef.current.srcObject = null;
  }

  async function startCamera() {
    setError(null);
    setRequestingCamera(true);
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Este navegador não oferece acesso à câmera nesta página.");
      setRequestingCamera(false);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: true,
        });
      } catch (firstError) {
        // Se o microfone não estiver disponível, ainda permitimos gravar somente vídeo.
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false,
          });
        } catch {
          throw firstError;
        }
      }

      streamRef.current = stream;
      setCameraReady(true);
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        await cameraRef.current.play().catch(() => undefined);
      }
    } catch (cameraError) {
      setError(cameraErrorMessage(cameraError));
    } finally {
      setRequestingCamera(false);
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function startRecording() {
    if (!streamRef.current) {
      setError("Ative a câmera antes de iniciar a gravação.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("Este navegador não oferece suporte à gravação de vídeo.");
      return;
    }

    const format = recordingFormat();
    try {
      const recorder = format.mimeType
        ? new MediaRecorder(streamRef.current, { mimeType: format.mimeType })
        : new MediaRecorder(streamRef.current);
      chunksRef.current = [];
      recorderRef.current = recorder;
      setSeconds(0);
      setRecordedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: format.contentType });
        const file = new File([blob], `exercicio-${Date.now()}.${format.extension}`, {
          type: format.contentType,
        });
        setRecordedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setRecording(false);
      };
      recorder.start(250);
      setRecording(true);
    } catch {
      setError("Não foi possível iniciar a gravação neste navegador.");
    }
  }

  function resetRecording() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRecordedFile(null);
    setSeconds(0);
    stopCamera();
    setError(null);
  }

  function useRecording() {
    if (!recordedFile) return;
    onRecorded(recordedFile);
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    setRecordedFile(null);
    setSeconds(0);
    setError(null);
    setCameraReady(false);
    setRequestingCamera(false);
    return () => {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      stopCamera();
    };
    // stopCamera intentionally remains local to this component lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current + 1 >= MAX_RECORDING_SECONDS) {
          window.setTimeout(stopRecording, 0);
          return MAX_RECORDING_SECONDS;
        }
        return current + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gravar vídeo do exercício"
      description={`Grave até ${MAX_RECORDING_SECONDS} segundos. O vídeo só será enviado quando você salvar o exercício.`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-xl bg-black">
          {previewUrl ? (
            <video src={previewUrl} controls playsInline className="aspect-video w-full object-contain" />
          ) : (
            <>
              <video ref={cameraRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-slate-300">
                  <div className="space-y-2 px-6">
                    <Camera className="mx-auto h-8 w-8" />
                    <p>Clique em “Ativar câmera” para permitir o acesso.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {recording && (
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-red-600">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
            Gravando · {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {previewUrl ? (
            <>
              <Button type="button" variant="outline" onClick={resetRecording}>
                <RotateCcw className="h-4 w-4" /> Gravar novamente
              </Button>
              <Button type="button" onClick={useRecording}>
                <Video className="h-4 w-4" /> Usar este vídeo
              </Button>
            </>
          ) : recording ? (
            <Button type="button" onClick={stopRecording}>
              <CircleStop className="h-4 w-4" /> Parar gravação
            </Button>
          ) : !cameraReady ? (
            <Button type="button" onClick={startCamera} loading={requestingCamera}>
              <Camera className="h-4 w-4" /> {error ? "Tentar novamente" : "Ativar câmera"}
            </Button>
          ) : (
            <Button type="button" onClick={startRecording}>
              <Camera className="h-4 w-4" /> Iniciar gravação
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
