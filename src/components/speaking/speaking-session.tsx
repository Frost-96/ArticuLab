"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Mic,
  Pause,
  Send,
  Square,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { endSpeakingAction } from "@/server/actions/speaking.action";
import { cn } from "@/lib/utils";
import type {
  SpeakingExerciseDetail,
  SpeakingMessage,
} from "@/types/speaking/speakingTypes";
import type { SpeakingChatResponse } from "@/schema/speaking.schema";

type SpeechToTextResult =
  | { success: true; data: { text: string } }
  | { success: false; error: string };

type SpeakingChatResult =
  | { success: true; data: SpeakingChatResponse }
  | { success: false; error: string };

type SpeakingSessionProps = {
  exercise: SpeakingExerciseDetail;
};

/** 格式化秒数为 mm:ss */
function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

/** 将 Base64 音频数据播放为 Audio */
async function playAudioFromBase64(base64: string) {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    await audio.play();
  } catch (error) {
    console.error("Failed to play audio:", error);
  }
}

async function playAudioFromUrl(audioUrl: string) {
  const playableUrl = audioUrl.startsWith("http")
    ? audioUrl
    : await fetch(
        `/api/speaking/getAudioURL?${new URLSearchParams({
          bucket: "ai-audio",
          path: audioUrl,
        })}`,
      )
        .then((response) => response.json())
        .then(
          (
            result:
              | { success: true; data: { url: string } }
              | { success: false; error: string },
          ) => {
            if (!result.success) {
              throw new Error(result.error);
            }

            return result.data.url;
          },
        );

  const audio = new Audio(playableUrl);
  await audio.play();
}

function createAudioRecorder(stream: MediaStream) {
  const preferredMimeType = "audio/webm;codecs=opus";

  if (MediaRecorder.isTypeSupported(preferredMimeType)) {
    return new MediaRecorder(stream, { mimeType: preferredMimeType });
  }

  return new MediaRecorder(stream);
}

export function SpeakingSession({ exercise }: SpeakingSessionProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [messages, setMessages] = useState<SpeakingMessage[]>(
    exercise.messages,
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [totalTurns, setTotalTurns] = useState(exercise.totalTurns);
  const [isSending, setIsSending] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const readOnly = exercise.status !== "in_progress";
  const latestMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [latestMessageId]);

  /** 开始录音 */
  async function handleStartRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = createAudioRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;
        setIsRecording(false);

        if (audioChunksRef.current.length === 0) return;
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
        await handleTranscribe(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setError(null);
    } catch {
      setError("Microphone access denied. Please allow microphone permission.");
    }
  }

  /** 停止录音 */
  const handleStopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      return;
    }

    recorder.stop();
    setIsRecording(false);
  }, []);

  /** 调用 STT API 转写音频 */
  const handleTranscribe = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", "en");

      const res = await fetch("/api/speaking/stt", {
        method: "POST",
        body: formData,
      });
      let result: SpeechToTextResult;
      try {
        result = (await res.json()) as SpeechToTextResult;
      } catch {
        result = {
          success: false,
          error: res.ok
            ? "Speech recognition failed."
            : "Speech recognition service is temporarily unavailable.",
        };
      }

      if (result.success) {
        if (res.ok) {
          setInput(result.data.text);
        } else {
          setError("Speech recognition failed.");
        }
      } else {
        setError(result.error || "Speech recognition failed.");
      }
    } catch {
      setError("Network error: Failed to transcribe audio.");
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  /** 发送消息（调用 Chat API：AI + TTS） */
  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || readOnly || isRecording || isTranscribing) return;

    setIsSending(true);
    setError(null);

    try {
      const res = await fetch("/api/speaking/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: exercise.id,
          conversationId: exercise.conversationId,
          message: content,
        }),
      });
      let result: SpeakingChatResult;
      try {
        result = (await res.json()) as SpeakingChatResult;
      } catch {
        result = {
          success: false,
          error: res.ok
            ? "Speaking AI could not respond right now. Please try again."
            : "Speaking AI service is temporarily unavailable. Please try again.",
        };
      }

      if (result.success) {
        const { userMessage, aiMessage, audioBase64 } = result.data;

        setMessages((prev) => [
          ...prev,
          {
            id: userMessage.id,
            role: "user",
            content: userMessage.content,
            audioUrl: null,
            createdAt: new Date().toISOString(),
          },
          {
            id: aiMessage.id,
            role: "assistant",
            content: aiMessage.content,
            audioUrl: aiMessage.audioUrl,
            createdAt: new Date().toISOString(),
          },
        ]);
        setTotalTurns(result.data.totalTurns);
        setInput("");

        if (audioBase64) {
          playAudioFromBase64(audioBase64);
        }

        startTransition(() => router.refresh());
      } else {
        setError(result.error || "Failed to send message.");
      }
    } catch {
      setError("Network error: Failed to send message.");
    } finally {
      setIsSending(false);
    }
  }, [
    input,
    readOnly,
    isRecording,
    isTranscribing,
    exercise.id,
    exercise.conversationId,
    router,
  ]);

  /** 结束练习 */
  async function handleFinish() {
    setIsFinishing(true);
    setError(null);

    const result = await endSpeakingAction({
      exerciseId: exercise.id,
    });

    setIsFinishing(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/speaking/${exercise.id}/review`);
  }

  async function handlePlayAudio(audioUrl: string) {
    setError(null);

    try {
      await playAudioFromUrl(audioUrl);
    } catch {
      setError("Unable to play this audio. Please try again.");
    }
  }

  /** 是否正在处理中 */
  const isBusy = isSending || isFinishing || isTranscribing;

  return (
    <div className="flex h-full min-h-full flex-col bg-white">
      <header className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/speaking">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate font-medium text-slate-900">
                {exercise.title}
              </h1>
              <p className="truncate text-xs text-slate-400">
                {exercise.aiRole} | {exercise.scenarioType}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary">{exercise.status}</Badge>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600"
              disabled={isFinishing}
              onClick={() => void handleFinish()}
            >
              <Square className="mr-2 h-3.5 w-3.5 fill-current" />
              Finish
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto flex min-h-full max-w-4xl flex-col px-4 py-6 sm:px-6">
          <section className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900">
                  {exercise.description || exercise.prompt || exercise.title}
                </p>
                {exercise.prompt ? (
                  <p className="text-sm leading-6 text-slate-500">
                    Prompt: {exercise.prompt}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                <span>{totalTurns} turns</span>
                <span>{formatDuration(exercise.durationSeconds)}</span>
              </div>
            </div>
          </section>

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex-1 space-y-7 pb-6">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[86%] text-sm leading-7 sm:max-w-[75%]",
                      message.role === "assistant"
                        ? "text-slate-800"
                        : "rounded-3xl bg-slate-100 px-4 py-2.5 text-slate-900",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.role === "assistant" ? (
                      <div className="mt-3 flex items-center gap-2 text-slate-500">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 rounded-full px-2 text-xs text-slate-600 hover:text-slate-900"
                          disabled={!message.audioUrl}
                          title={
                            message.audioUrl
                              ? "Play audio"
                              : "Audio is not available for this message"
                          }
                          onClick={() => {
                            if (message.audioUrl) {
                              void handlePlayAudio(message.audioUrl);
                            }
                          }}
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          Audio
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="max-w-md text-center text-sm leading-6 text-slate-500">
                  No transcript yet. Start recording or type a response to begin
                  the conversation.
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      <footer className="shrink-0 bg-white px-3 pb-4 sm:px-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-end gap-2">
              <button
                type="button"
                disabled={readOnly || isBusy}
                onClick={
                  isRecording
                    ? () => handleStopRecording()
                    : () => void handleStartRecording()
                }
                className={cn(
                  "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-white transition-all",
                  isRecording
                    ? "border-red-300 bg-red-500"
                    : "border-blue-600 bg-blue-600 hover:bg-blue-700",
                  (readOnly || isBusy) && "cursor-not-allowed opacity-60",
                )}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? (
                  <>
                    <span className="absolute inset-0 animate-ping rounded-full bg-red-400/30" />
                    <Pause className="relative h-5 w-5" />
                  </>
                ) : isTranscribing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>

              <textarea
                value={input}
                disabled={readOnly || isBusy}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={
                  readOnly
                    ? "This completed session is available for review."
                    : isTranscribing
                      ? "Transcribing your speech..."
                      : isRecording
                        ? "Speak now. Click the mic button to stop..."
                        : "Type or record your response..."
                }
                className="max-h-36 min-h-11 w-full resize-none border-0 bg-transparent px-2 py-2.5 text-sm leading-6 outline-none placeholder:text-slate-400"
              />

              <Button
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={!input.trim() || readOnly || isBusy}
                onClick={() => void handleSend()}
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between px-2 text-xs text-slate-400">
              <span>
                {isRecording
                  ? "Recording..."
                  : isTranscribing
                    ? "Transcribing..."
                    : isSending
                      ? "AI is responding..."
                      : "Ready"}
              </span>
              <span>
                {totalTurns} turns | {formatDuration(exercise.durationSeconds)}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
