"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAppLoading,
  useLoadingRouter,
} from "@/components/ui/loading-overlay";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  MessageSquarePlus,
  Mic,
  Pause,
  Send,
  Sparkles,
} from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CoachPageData } from "@/types/coach/coachTypes";

type CoachHistoryPageProps = {
  data: CoachPageData;
};

type LocalCoachMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  pending?: boolean;
};

type CoachApiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type CoachStreamEvent =
  | { type: "text_delta"; data: { delta: string } }
  | {
      type: "message_saved";
      data: {
        conversationId: string;
        userMessage: CoachApiMessage;
        assistantMessage: CoachApiMessage;
      };
    }
  | { type: "done"; data: { fullText: string } }
  | { type: "error"; data: { error: string } }
  | { type: "essay_detected"; data: { message: string } };

type ParsedSSEEvent = {
  type: string;
  data: unknown;
};

type SpeechToTextResponse =
  | { success: true; data: { text: string } }
  | { success: false; error: string };

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

async function parseErrorResponse(response: Response, fallbackMessage: string) {
  try {
    const result = (await response.json()) as { error?: string };
    return result.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}
function createAudioRecorder(stream: MediaStream) {
  const preferredMimeType = "audio/webm;codecs=opus";

  if (MediaRecorder.isTypeSupported(preferredMimeType)) {
    return new MediaRecorder(stream, { mimeType: preferredMimeType });
  }

  return new MediaRecorder(stream);
}

function HighlightedCoachText({ content }: { content: string }) {
  const pieces = content.split(
    /(He goes|He went|verb form|thesis|topic sentences|vocabulary upgrade)/gi,
  );

  return (
    <p className="whitespace-pre-wrap">
      {pieces.map((piece, index) => {
        const normalized = piece.toLowerCase();
        const isCorrection =
          normalized === "he goes" ||
          normalized === "he went" ||
          normalized === "verb form";
        const isTip =
          normalized === "thesis" ||
          normalized === "topic sentences" ||
          normalized === "vocabulary upgrade";

        if (!isCorrection && !isTip) {
          return <span key={`${piece}-${index}`}>{piece}</span>;
        }

        return (
          <span
            key={`${piece}-${index}`}
            className={
              isCorrection
                ? "rounded bg-red-50 px-1 font-medium text-red-700"
                : "rounded bg-blue-50 px-1 font-medium text-blue-700"
            }
          >
            {piece}
          </span>
        );
      })}
    </p>
  );
}

function CoachMessageBubble({
  message,
  locale,
  thinkingLabel,
}: {
  message: LocalCoachMessage;
  locale: string;
  thinkingLabel: string;
}) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex w-full",
        isAssistant ? "justify-start" : "justify-end",
      )}
    >
      <div
        className={cn(
          "max-w-[86%] text-sm leading-7 sm:max-w-[75%]",
          isAssistant
            ? "text-slate-800"
            : "rounded-3xl bg-slate-100 px-4 py-2.5 text-slate-900",
        )}
      >
        {isAssistant ? (
          <HighlightedCoachText content={message.content} />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        {isAssistant ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            {message.pending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {thinkingLabel}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3" />
                {formatDate(message.createdAt, locale)}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CoachHistoryPage({ data }: CoachHistoryPageProps) {
  const router = useLoadingRouter();
  const { showLoading } = useAppLoading();
  const locale = useLocale();
  const t = useTranslations("coach");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamAbortRef = useRef<AbortController | null>(null);
  const activeConversationId = data.activeConversation?.id ?? null;
  const latestConversation = data.conversations[0] ?? null;
  const [draft, setDraft] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<LocalCoachMessage[]>([]);
  const messages = useMemo(() => {
    const serverMessages = data.activeConversation?.messages ?? [];
    const seen = new Set(serverMessages.map((message) => message.id));
    return [
      ...serverMessages,
      ...localMessages.filter((message) => !seen.has(message.id)),
    ];
  }, [data.activeConversation?.messages, localMessages]);
  const latestMessageId = messages[messages.length - 1]?.id;
  const quickPrompts = [
    t("quickGrammar"),
    t("quickAcademic"),
    t("quickNatural"),
  ];

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

  const handleTranscribe = useCallback(
    async (audioBlob: Blob) => {
      setIsTranscribing(true);
      setErrorMessage(null);

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("language", "en");
        if (activeConversationId) {
          formData.append("conversationId", activeConversationId);
        }

        const response = await fetch("/api/speaking/stt", {
          method: "POST",
          body: formData,
        });
        let result: SpeechToTextResponse;
        try {
          result = (await response.json()) as SpeechToTextResponse;
        } catch {
          result = {
            success: false,
            error: response.ok ? t("speechFailed") : t("speechUnavailable"),
          };
        }

        if (result.success) {
          if (!response.ok) {
            setErrorMessage(t("speechFailed"));
            return;
          }

          setDraft(result.data.text);
          return;
        }

        setErrorMessage(result.error || t("speechFailed"));
      } catch {
        setErrorMessage(t("networkTranscribe"));
      } finally {
        setIsTranscribing(false);
      }
    },
    [activeConversationId, t],
  );

  const handleStartRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setErrorMessage(t("recordingUnsupported"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = createAudioRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        setIsRecording(false);

        if (audioChunksRef.current.length === 0) {
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
        void handleTranscribe(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setErrorMessage(null);
    } catch {
      setErrorMessage(t("micDenied"));
    }
  }, [handleTranscribe, t]);

  const handleStopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      return;
    }

    recorder.stop();
    setIsRecording(false);
  }, []);

  async function handleSend() {
    const content = draft.trim();
    if (!content || isComposing || isRecording || isTranscribing) {
      return;
    }

    const controller = new AbortController();
    const now = new Date().toISOString();
    const localUserId = `local-user-${now}`;
    const localAssistantId = `local-ai-${now}`;
    let streamError: string | null = null;

    const userMessage: LocalCoachMessage = {
      id: localUserId,
      role: "user",
      content,
      createdAt: now,
      pending: true,
    };
    const assistantMessage: LocalCoachMessage = {
      id: localAssistantId,
      role: "assistant",
      content: "",
      createdAt: now,
      pending: true,
    };

    streamAbortRef.current?.abort();
    streamAbortRef.current = controller;

    setDraft("");
    setErrorMessage(null);
    setIsComposing(true);
    setLocalMessages((current) => [...current, userMessage, assistantMessage]);

    try {
      const response = await fetch("/api/coach/chat-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: activeConversationId ?? undefined,
          message: content,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(
          await parseErrorResponse(response, t("serviceUnavailable")),
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let isDone = false;
      let resolvedConversationId = activeConversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.trim()) continue;

          const parsed = parseSSEEvent(part) as CoachStreamEvent | null;
          if (!parsed) continue;

          switch (parsed.type) {
            case "text_delta":
              setLocalMessages((current) =>
                current.map((message) =>
                  message.id === localAssistantId
                    ? {
                        ...message,
                        content: message.content + parsed.data.delta,
                      }
                    : message,
                ),
              );
              break;
            case "message_saved":
              resolvedConversationId = parsed.data.conversationId;
              setLocalMessages((current) =>
                current.map((message) => {
                  if (message.id === localUserId) {
                    return { ...parsed.data.userMessage, pending: false };
                  }
                  if (message.id === localAssistantId) {
                    return { ...parsed.data.assistantMessage, pending: false };
                  }
                  return message;
                }),
              );
              break;
            case "done":
              isDone = true;
              setIsComposing(false);
              break;
            case "error":
              streamError = parsed.data.error;
              setErrorMessage(parsed.data.error);
              break;
            case "essay_detected":
              // 作文检测命中，移除本地助手消息并提示用户前往写作页面
              setLocalMessages((current) =>
                current.filter((item) => item.id !== localAssistantId),
              );
              streamError = parsed.data.message;
              setErrorMessage(parsed.data.message);
              break;
          }
        }
      }

      if (streamError) {
        throw new Error(streamError);
      }

      if (!isDone) {
        throw new Error(t("streamIncomplete"));
      }

      if (!activeConversationId && resolvedConversationId) {
        router.replace(`/coach?id=${resolvedConversationId}`);
      }
      router.refresh();
    } catch (error) {
      if (controller.signal.aborted) return;

      const message = error instanceof Error ? error.message : t("sendFailed");
      setErrorMessage(message);
      setDraft(content);
      setLocalMessages((current) =>
        current.filter(
          (item) => item.id !== localUserId && item.id !== localAssistantId,
        ),
      );
    } finally {
      if (streamAbortRef.current === controller) {
        streamAbortRef.current = null;
      }
      setIsComposing(false);
    }
  }

  const isBusy = isComposing || isTranscribing;
  const canSend =
    Boolean(draft.trim()) && !isComposing && !isRecording && !isTranscribing;

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col bg-white">
        <main className="flex-1 overflow-auto">
          <div className="mx-auto flex min-h-full max-w-4xl flex-col px-4 py-6 sm:px-6">
            {messages.length ? (
              <div className="flex-1 space-y-7 pb-6">
                {messages.map((message) => (
                  <CoachMessageBubble
                    key={message.id}
                    message={message}
                    locale={locale}
                    thinkingLabel={t("thinking")}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center py-8">
                <div className="w-full max-w-2xl text-center">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white">
                    {data.conversations.length === 0 ? (
                      <Sparkles className="h-6 w-6" />
                    ) : (
                      <MessageSquarePlus className="h-6 w-6" />
                    )}
                  </div>
                  <h1 className="text-2xl font-semibold text-slate-950">
                    {t("title")}
                  </h1>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    {t("description")}
                  </p>
                  <div className="mt-6 grid gap-2 sm:grid-cols-3">
                    {quickPrompts.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setDraft(item)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm leading-5 text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  {latestConversation ? (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          showLoading();
                          router.push(`/coach?id=${latestConversation.id}`);
                        }}
                        className="group rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-left text-sm leading-5 text-teal-800 transition hover:bg-teal-100"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">
                            {t("continueLatest")}
                          </span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <p className="mt-1 truncate text-xs text-teal-700/80">
                          {latestConversation.title}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          showLoading();
                          router.push("/coach");
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm leading-5 text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                      >
                        <span className="font-semibold">{t("startNew")}</span>
                        <p className="mt-1 text-xs text-slate-500">
                          {t("newDescription")}
                        </p>
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="shrink-0 bg-white px-3 pb-4 sm:px-4">
          <div className="mx-auto max-w-4xl">
            {errorMessage ? (
              <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
            {messages.length ? (
              <div className="mb-2 flex flex-wrap gap-2 px-1">
                {quickPrompts.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setDraft(suggestion)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
              <div className="flex items-end gap-2">
                <Textarea
                  value={draft}
                  disabled={isBusy || isRecording}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder={t("placeholder")}
                  className="max-h-36 min-h-11 resize-none border-0 bg-transparent px-2 py-2.5 text-sm leading-6 shadow-none focus-visible:ring-0"
                  rows={1}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <LoadingButton
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-11 w-11 rounded-full border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800",
                        isRecording &&
                          "border-red-300 bg-red-500 text-white hover:bg-red-600 hover:text-white",
                      )}
                      disabled={!isRecording && (isComposing || isTranscribing)}
                      onClick={
                        isRecording
                          ? () => handleStopRecording()
                          : () => void handleStartRecording()
                      }
                      aria-label={
                        isRecording ? t("stopRecording") : t("startVoice")
                      }
                      isLoading={isTranscribing}
                      loadingText=""
                    >
                      {isRecording ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </LoadingButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRecording
                      ? t("stopRecording")
                      : isTranscribing
                        ? t("transcribing")
                        : t("voiceInput")}
                  </TooltipContent>
                </Tooltip>
                <LoadingButton
                  size="icon"
                  className="h-11 w-11 rounded-full bg-teal-600 text-white hover:bg-teal-700"
                  onClick={() => void handleSend()}
                  disabled={!canSend}
                  aria-label={t("send")}
                  isLoading={isComposing}
                  loadingText=""
                >
                  <Send className="h-4 w-4" />
                </LoadingButton>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
