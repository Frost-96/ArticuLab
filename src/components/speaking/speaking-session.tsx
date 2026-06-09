"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  LoadingLink,
  useAppLoading,
  useLoadingRouter,
} from "@/components/ui/loading-overlay";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mic,
  Pause,
  Send,
  Square,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import { endSpeakingAction } from "@/server/actions/speaking.action";
import { cn } from "@/lib/utils";
import type {
  SpeakingExerciseDetail,
  SpeakingMessage,
} from "@/types/speaking/speakingTypes";

type SpeechToTextResult =
  | { success: true; data: { text: string } }
  | { success: false; error: string };

type SpeakingStreamEvent =
  | { type: "text_delta"; data: { delta: string } }
  | { type: "sentence"; data: { index: number; text: string } }
  | {
      type: "audio_chunk";
      data: { index: number; audioBase64: string; format: "mp3" };
    }
  | { type: "message_saved"; data: { messageId: string; totalTurns: number } }
  | { type: "done"; data: { fullText: string } }
  | { type: "error"; data: { error: string } };

type ParsedSSEEvent = {
  type: string;
  data: unknown;
};

type SpeakingSessionProps = {
  exercise: SpeakingExerciseDetail;
};
function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
function parseSSEEvent(raw: string): ParsedSSEEvent | null {
  let type = "";
  let data = "";

  for (const line of raw.split("\n")) {
    if (line.startsWith(":")) continue;
    if (line.startsWith("event: ")) {
      type = line.slice(7);
      continue;
    }
    if (line.startsWith("data: ")) {
      data += (data ? "\n" : "") + line.slice(6);
    }
  }

  if (!type || !data) return null;

  return {
    type,
    data: JSON.parse(data),
  };
}

async function parseErrorResponse(response: Response) {
  try {
    const result = (await response.json()) as { error?: string };
    return result.error || "Speaking AI service is temporarily unavailable.";
  } catch {
    return "Speaking AI service is temporarily unavailable.";
  }
}

function createLocalSpeakingMessage(
  id: string,
  role: SpeakingMessage["role"],
  content: string,
  pending?: boolean,
): SpeakingMessage {
  return {
    id,
    role,
    content,
    audioUrl: null,
    createdAt: new Date().toISOString(),
    pending,
  };
}

function audioBase64ToUrl(base64: string, format: "mp3" | "wav") {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const mimeType = format === "mp3" ? "audio/mpeg" : "audio/wav";
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

async function playAudioFromUrl(audioUrl: string, bucket = "ai-audio") {
  const playableUrl = audioUrl.startsWith("http")
    ? audioUrl
    : await fetch(
        `/api/speaking/getAudioURL?${new URLSearchParams({
          bucket,
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
  const router = useLoadingRouter();
  const nextRouter = useRouter();
  const { hideLoading, showLoading } = useAppLoading();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamAbortRef = useRef<AbortController | null>(null);
  const streamAudioQueueRef = useRef<
    Array<{ index: number; audioBase64: string; format: "mp3" }>
  >([]);
  const isPlayingStreamAudioRef = useRef(false);
  /** 等待后端持久化音频的消息 ID 集合，用于轮询 audioUrl */
  const pendingAudioRef = useRef<Set<string>>(new Set());
  /** 保留最近一次用户录音的 blob，以便随消息一起发送到服务器 */
  const lastRecordingRef = useRef<Blob | null>(null);

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
  /** 正在进行发音评估的消息 ID 集合 */
  const [evaluatingIds, setEvaluatingIds] = useState<Set<string>>(new Set());
  const latestMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [latestMessageId]);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  /** 服务端数据更新后同步到本地 state（如 audioUrl 持久化完成） */
  useEffect(() => {
    setMessages(exercise.messages);
  }, [exercise.messages]);

  /** 轮询等待后端持久化音频完成，间隔逐渐减半 */
  useEffect(() => {
    if (pendingAudioRef.current.size === 0) return;

    let timer: ReturnType<typeof setTimeout>;
    let delay = 4000;
    const minDelay = 1000;

    const poll = () => {
      let changed = false;
      for (const id of pendingAudioRef.current) {
        const msg = messages.find((m) => m.id === id);
        if (msg?.audioUrl) {
          pendingAudioRef.current.delete(id);
          changed = true;
        }
      }
      if (changed) {
        pendingAudioRef.current = new Set(pendingAudioRef.current);
      }
      if (pendingAudioRef.current.size > 0) {
        startTransition(() => nextRouter.refresh());
        delay = Math.max(minDelay, delay / 2);
        timer = setTimeout(poll, delay);
      }
    };

    timer = setTimeout(poll, delay);
    return () => clearTimeout(timer);
  }, [messages, router]);

  const playNextStreamAudio = useCallback(() => {
    if (isPlayingStreamAudioRef.current) return;

    const nextAudio = streamAudioQueueRef.current.shift();
    if (!nextAudio) return;

    isPlayingStreamAudioRef.current = true;

    try {
      const url = audioBase64ToUrl(nextAudio.audioBase64, nextAudio.format);
      const audio = new Audio(url);

      const release = () => {
        URL.revokeObjectURL(url);
        isPlayingStreamAudioRef.current = false;
        playNextStreamAudio();
      };

      audio.onended = release;
      audio.onerror = release;
      void audio.play().catch(release);
    } catch {
      isPlayingStreamAudioRef.current = false;
      playNextStreamAudio();
    }
  }, []);

  const enqueueStreamAudio = useCallback(
    (data: { index: number; audioBase64: string; format: "mp3" }) => {
      streamAudioQueueRef.current.push(data);
      streamAudioQueueRef.current.sort((a, b) => a.index - b.index);
      playNextStreamAudio();
    },
    [playNextStreamAudio],
  );
  async function handleStartRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
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
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
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
  const handleStopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      return;
    }

    recorder.stop();
    setIsRecording(false);
  }, []);
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
          // 保留录音 blob，以便发送消息时一并上传到服务器
          lastRecordingRef.current = audioBlob;
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
  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || readOnly || isRecording || isTranscribing) return;

    const controller = new AbortController();
    const timestamp = Date.now();
    const localUserId = `local-user-${timestamp}`;
    const localAssistantId = `local-assistant-${timestamp}`;
    let streamError: string | null = null;

    streamAbortRef.current?.abort();
    streamAbortRef.current = controller;
    streamAudioQueueRef.current = [];
    isPlayingStreamAudioRef.current = false;

    setIsSending(true);
    setError(null);
    setInput("");
    setMessages((prev) => [
      ...prev,
      createLocalSpeakingMessage(localUserId, "user", content, false),
      createLocalSpeakingMessage(localAssistantId, "assistant", "", true),
    ]);

    try {
      const formData = new FormData();
      formData.append("exerciseId", exercise.id);
      formData.append("conversationId", exercise.conversationId);
      formData.append("message", content);
      // 如果用户通过录音输入，将音频一并上传以便后续播放和发音评估
      const recordingBlob = lastRecordingRef.current;
      lastRecordingRef.current = null;
      if (recordingBlob) {
        formData.append("audio", recordingBlob, "recording.webm");
      }

      const res = await fetch("/api/speaking/chat-stream", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(await parseErrorResponse(res));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let isDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.trim()) continue;

          const parsed = parseSSEEvent(part) as SpeakingStreamEvent | null;
          if (!parsed) continue;

          switch (parsed.type) {
            case "text_delta":
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === localAssistantId
                    ? {
                        ...message,
                        content: message.content + parsed.data.delta,
                        pending: false,
                      }
                    : message,
                ),
              );
              break;
            case "audio_chunk":
              enqueueStreamAudio(parsed.data);
              break;
            case "message_saved":
              setTotalTurns(parsed.data.totalTurns);
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === localAssistantId
                    ? {
                        ...message,
                        id: parsed.data.messageId,
                      }
                    : message,
                ),
              );
              break;
            case "done":
              isDone = true;
              setIsSending(false);
              /** 标记消息等待后端持久化音频 */
              pendingAudioRef.current.add(localAssistantId);
              break;
            case "error":
              streamError = parsed.data.error;
              setError(parsed.data.error);
              break;
            case "sentence":
              break;
          }
        }
      }

      if (streamError) {
        throw new Error(streamError);
      }

      if (!isDone) {
        throw new Error("Stream ended before the response was complete.");
      }

      startTransition(() => router.refresh());
    } catch (error) {
      if (controller.signal.aborted) return;

      const message =
        error instanceof Error
          ? error.message
          : "Network error: Failed to send message.";
      setError(message);
      setInput(content);
      setMessages((prev) =>
        prev.filter(
          (message) =>
            message.id !== localUserId && message.id !== localAssistantId,
        ),
      );
    } finally {
      if (streamAbortRef.current === controller) {
        streamAbortRef.current = null;
      }
      setIsSending(false);
    }
  }, [
    input,
    readOnly,
    isRecording,
    isTranscribing,
    exercise.id,
    exercise.conversationId,
    enqueueStreamAudio,
    router,
  ]);
  async function handleFinish() {
    setIsFinishing(true);
    setError(null);
    showLoading("Finishing...");

    const result = await endSpeakingAction({
      exerciseId: exercise.id,
    });

    setIsFinishing(false);

    if (!result.success) {
      setError(result.error);
      hideLoading();
      return;
    }

    router.push(`/speaking/${exercise.id}/review`);
  }

  async function handlePlayAudio(audioUrl: string, bucket = "ai-audio") {
    setError(null);

    try {
      await playAudioFromUrl(audioUrl, bucket);
    } catch {
      setError("Unable to play this audio. Please try again.");
    }
  }

  /** 对用户录音进行发音评估 */
  async function handleEvaluatePronunciation(
    messageId: string,
    audioUrl: string,
    referenceText: string,
  ) {
    setEvaluatingIds((prev) => new Set(prev).add(messageId));
    setError(null);

    try {
      // 先将存储路径解析为可访问的完整 URL
      const playableUrl = audioUrl.startsWith("http")
        ? audioUrl
        : await fetch(
            `/api/speaking/getAudioURL?${new URLSearchParams({
              bucket: "user-audio",
              path: audioUrl,
            })}`,
          )
            .then((r) => r.json())
            .then((result) => {
              if (!result.success) throw new Error(result.error);
              return result.data.url as string;
            });
      const audioRes = await fetch(playableUrl);
      const audioBlob = await audioRes.blob();

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("referenceText", referenceText);
      formData.append("language", "en-US");
      formData.append("messageId", messageId);

      const res = await fetch("/api/speaking/pronunciation", {
        method: "POST",
        body: formData,
      });

      const result = (await res.json()) as {
        success: boolean;
        data?: {
          pronunciationScore: number;
          accuracyScore: number;
          fluencyScore: number;
          completenessScore: number;
          prosodyScore: number;
        };
        error?: string;
      };

      if (result.success && result.data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  pronunciationScore: result.data!.pronunciationScore,
                  pronunciationAccuracy: result.data!.accuracyScore,
                  pronunciationFluency: result.data!.fluencyScore,
                  pronunciationCompleteness: result.data!.completenessScore,
                  pronunciationProsody: result.data!.prosodyScore,
                }
              : m,
          ),
        );
      } else {
        setError(result.error || "Pronunciation evaluation failed.");
      }
    } catch {
      setError("Failed to evaluate pronunciation. Please try again.");
    } finally {
      setEvaluatingIds((prev) => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  }

  /** 鏄惁姝ｅ湪澶勭悊涓?*/
  const isBusy = isSending || isFinishing || isTranscribing;
  const isReviewed = exercise.status === "reviewed";
  const canFinish = exercise.status === "in_progress";
  const canOpenReview =
    exercise.status === "completed" || exercise.status === "reviewed";

  return (
    <div className="flex h-full min-h-full flex-col bg-white">
      <header className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <LoadingLink href="/speaking">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </LoadingLink>
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
            {canFinish ? (
              <LoadingButton
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={isFinishing}
                onClick={() => void handleFinish()}
                isLoading={isFinishing}
                loadingText="Finishing..."
              >
                <Square className="mr-2 h-3.5 w-3.5 fill-current" />
                Finish
              </LoadingButton>
            ) : canOpenReview ? (
              <Button
                size="sm"
                className="bg-sky-600 text-white hover:bg-sky-700"
                asChild
              >
                <LoadingLink href={`/speaking/${exercise.id}/review`}>
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                  {isReviewed ? "Reviewed" : "Review"}
                </LoadingLink>
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                {exercise.status}
              </Button>
            )}
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
                      message.pending ? (
                        /** AI 思考中：显示转圈动画 */
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Thinking...
                        </div>
                      ) : (
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
                      )
                    ) : (
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 rounded-full px-2 text-xs text-slate-600 hover:text-slate-900"
                          disabled={!message.audioUrl}
                          title={
                            message.audioUrl
                              ? "Play your recording"
                              : "Audio not available"
                          }
                          onClick={() => {
                            if (message.audioUrl) {
                              void handlePlayAudio(
                                message.audioUrl,
                                "user-audio",
                              );
                            }
                          }}
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          Audio
                        </Button>
                        {message.pronunciationScore != null ? (
                          <span className="text-xs font-medium text-green-600">
                            {message.pronunciationScore}分
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 rounded-full px-2 text-xs text-slate-600 hover:text-slate-900"
                            disabled={
                              !message.audioUrl || evaluatingIds.has(message.id)
                            }
                            title={
                              !message.audioUrl
                                ? "Audio not available"
                                : "Evaluate pronunciation"
                            }
                            onClick={() => {
                              if (message.audioUrl) {
                                void handleEvaluatePronunciation(
                                  message.id,
                                  message.audioUrl,
                                  message.content,
                                );
                              }
                            }}
                          >
                            {evaluatingIds.has(message.id) ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Mic className="h-3.5 w-3.5" />
                            )}
                            Analyze
                          </Button>
                        )}
                      </div>
                    )}
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

              <LoadingButton
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={!input.trim() || readOnly || isBusy}
                onClick={() => void handleSend()}
                aria-label="Send message"
                isLoading={isSending}
                loadingText=""
              >
                <Send className="h-4 w-4" />
              </LoadingButton>
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
