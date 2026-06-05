"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { signUp, login, logOut } from "@/server/actions/auth.action";
import {
  getScenarioListAction,
  getSpeakingScenarioTypesAction,
  getWritingScenarioTypesAction,
} from "@/server/actions/scenario.action";
import { startSpeakingAction } from "@/server/actions/speaking.action";
import {
  getUserProfile,
  updatePassword,
  updateUserProfile,
} from "@/server/actions/user.action";
import {
  createWritingExerciseAction,
  getWritingHistoryAction,
  getWritingExerciseAction,
  deleteWritingExerciseAction,
  getDraftAction,
  saveDraftAction,
  submitWritingAction,
  getWritingResultAction,
} from "@/server/actions/writing.action";
import type { ActionResult } from "@/schema";

// 结果展示组件
function ResultDisplay({ result, title }: { result: any; title: string }) {
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 w-full rounded-md border p-2">
          <pre className="text-xs whitespace-pre-wrap break-all">
            {JSON.stringify(result, null, 2)}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function TestPage() {
  // Auth 状态
  const [authResult, setAuthResult] = useState<any>(null);
  const [registerForm, setRegisterForm] = useState({
    email: `test_${Date.now()}@example.com`,
    password: "Test123456!",
    confirmPassword: "Test123456!",
    name: "Test User",
  });
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Scenario 状态
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [scenarioFilter, setScenarioFilter] = useState({
    category: "speaking",
    page: 1,
    pageSize: 10,
  });

  // User 状态
  const [userResult, setUserResult] = useState<any>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [profileForm, setProfileForm] = useState({
    name: "",
    englishLevel: "B1",
    learningGoal: "Improve speaking skills",
  });

  // Writing 状态
  const [writingResult, setWritingResult] = useState<any>(null);
  const [exerciseId, setExerciseId] = useState("");
  const [createExerciseForm, setCreateExerciseForm] = useState({
    scenarioType: "ielts_task1",
    isCustomPrompt: false,
    prompt: "",
    scenarioId: undefined as string | undefined,
  });
  const [draftForm, setDraftForm] = useState({
    exerciseId: "",
    content: "This is a test draft content.",
    wordCount: 0,
  });
  const [submitForm, setSubmitForm] = useState({
    exerciseId: "",
    scenarioType: "ielts_task1",
    prompt: "",
    isCustomPrompt: false,
    content: "This is a test submission content for AI evaluation.",
  });
  const [historyFilter, setHistoryFilter] = useState({
    page: 1,
    pageSize: 10,
    status: undefined as string | undefined,
  });

  // Speaking 状态
  const [speakingResult, setSpeakingResult] = useState<any>(null);
  const [chatForm, setChatForm] = useState({
    exerciseId: "",
    conversationId: "",
    message: "Hello, I'd like to practice speaking English.",
  });
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [sttText, setSttText] = useState<string | null>(null);
  const [lastAudioBase64, setLastAudioBase64] = useState<string | null>(null);
  const [lastUserMessageId, setLastUserMessageId] = useState<string | null>(
    null,
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [speakingCreateForm, setSpeakingCreateForm] = useState({
    scenarioId: "",
    scenarioCategory: "free",
    title: "Test Speaking Exercise",
    aiRole: "English Teacher",
  });
  const [createdExercise, setCreatedExercise] = useState<{
    id: string;
    conversationId: string;
  } | null>(null);
  const [reviewForm, setReviewForm] = useState({
    exerciseId: "",
    score: true,
    words: false,
    phonemes: false,
  });

  // 音频 URL 获取状态
  const [audioUrlForm, setAudioUrlForm] = useState({
    bucket: "user-audio",
    path: "",
  });
  const [fetchedAudioUrl, setFetchedAudioUrl] = useState<string | null>(null);

  // Streaming Chat 状态
  const [streamResult, setStreamResult] = useState<string>("");
  const [streamEvents, setStreamEvents] = useState<
    Array<{ type: string; data: unknown; time: number }>
  >([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamAudioQueueRef = useRef<
    Array<{ index: number; audioBase64: string }>
  >([]);
  const isPlayingRef = useRef(false);

  // ==================== Auth Actions ====================
  const handleRegister = async () => {
    const result = await signUp(registerForm);
    setAuthResult(result);
  };

  const handleLogin = async () => {
    const result = await login(loginForm);
    setAuthResult(result);
  };

  const handleLogout = async () => {
    await logOut();
    setAuthResult({ success: true, message: "Logged out successfully" });
  };

  // ==================== Scenario Actions ====================
  const handleGetSpeakingTypes = async () => {
    const result = await getSpeakingScenarioTypesAction();
    setScenarioResult(result);
  };

  const handleGetWritingTypes = async () => {
    const result = await getWritingScenarioTypesAction();
    setScenarioResult(result);
  };

  const handleGetScenarioList = async () => {
    const result = await getScenarioListAction(scenarioFilter as any);
    setScenarioResult(result);
  };

  // ==================== User Actions ====================
  const handleGetUserProfile = async () => {
    const result = await getUserProfile();
    setUserResult(result);
  };

  const handleUpdatePassword = async () => {
    const result = await updatePassword(passwordForm);
    setUserResult(result);
  };

  const handleUpdateProfile = async () => {
    // userId 将从 session 中获取，不需要传入
    const result = await updateUserProfile(profileForm as any);
    setUserResult(result);
  };

  // ==================== Writing Actions ====================
  const handleCreateExercise = async () => {
    const result = await createWritingExerciseAction(createExerciseForm as any);
    setWritingResult(result);
    if (result.success) {
      setExerciseId(result.data.exercise.id);
    }
  };

  const handleGetHistory = async () => {
    const result = await getWritingHistoryAction(historyFilter as any);
    setWritingResult(result);
  };

  const handleGetExercise = async () => {
    if (!exerciseId) {
      setWritingResult({
        success: false,
        error: "Please enter an exercise ID",
      });
      return;
    }
    const result = await getWritingExerciseAction({ exerciseId });
    setWritingResult(result);
  };

  const handleDeleteExercise = async () => {
    if (!exerciseId) {
      setWritingResult({
        success: false,
        error: "Please enter an exercise ID",
      });
      return;
    }
    const result = await deleteWritingExerciseAction({ exerciseId });
    setWritingResult(result);
  };

  const handleSaveDraft = async () => {
    if (!draftForm.exerciseId) {
      setWritingResult({
        success: false,
        error: "Please enter an exercise ID",
      });
      return;
    }
    // 自动计算字数（按空格分割）
    const wordCount = draftForm.content.trim()
      ? draftForm.content.trim().split(/\s+/).length
      : 0;
    const result = await saveDraftAction({
      ...draftForm,
      wordCount,
    });
    setWritingResult(result);
  };

  const handleGetDraft = async () => {
    if (!draftForm.exerciseId) {
      setWritingResult({
        success: false,
        error: "Please enter an exercise ID",
      });
      return;
    }
    const result = await getDraftAction({ exerciseId: draftForm.exerciseId });
    setWritingResult(result);
  };

  const handleSubmitWriting = async () => {
    if (!submitForm.exerciseId) {
      setWritingResult({
        success: false,
        error: "Please enter an exercise ID",
      });
      return;
    }
    const result = await submitWritingAction(submitForm as any);
    setWritingResult(result);
  };

  const handleGetResult = async () => {
    if (!exerciseId) {
      setWritingResult({
        success: false,
        error: "Please enter an exercise ID",
      });
      return;
    }
    const result = await getWritingResultAction({ exerciseId });
    setWritingResult(result);
  };

  // ==================== Speaking Actions ====================

  /** 创建口语练习 */
  const handleCreateSpeakingExercise = async () => {
    setSpeakingResult({ loading: true, message: "Creating exercise..." });
    try {
      const input = speakingCreateForm.scenarioId
        ? { scenarioId: speakingCreateForm.scenarioId }
        : {
            scenarioCategory: speakingCreateForm.scenarioCategory as any,
            title: speakingCreateForm.title,
            aiRole: speakingCreateForm.aiRole,
          };
      const result = await startSpeakingAction(input as any);
      setSpeakingResult(result);
      if (result.success) {
        const { id, conversationId } = result.data.exercise;
        setCreatedExercise({ id, conversationId });
        setChatForm((prev) => ({
          ...prev,
          exerciseId: id,
          conversationId,
        }));
        setReviewForm((prev) => ({ ...prev, exerciseId: id }));
      }
    } catch {
      setSpeakingResult({ success: false, error: "Failed to create exercise" });
    }
  };

  /** 生成 AI Review */
  const handleReview = async () => {
    if (!reviewForm.exerciseId) {
      setSpeakingResult({ success: false, error: "exerciseId is required" });
      return;
    }
    setSpeakingResult({ loading: true, message: "Generating AI review..." });
    try {
      const res = await fetch("/api/speaking/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: reviewForm.exerciseId,
          score: reviewForm.score,
          words: reviewForm.words,
          phonemes: reviewForm.phonemes,
        }),
      });
      const result = await res.json();
      setSpeakingResult(result);
    } catch {
      setSpeakingResult({ success: false, error: "Network error" });
    }
  };

  /** 获取 message 音频的签名 URL */
  const handleGetAudioUrl = async () => {
    if (!audioUrlForm.path.trim()) {
      setSpeakingResult({ success: false, error: "path is required" });
      return;
    }
    setSpeakingResult({ loading: true, message: "Fetching audio URL..." });
    setFetchedAudioUrl(null);
    try {
      const params = new URLSearchParams({
        bucket: audioUrlForm.bucket,
        path: audioUrlForm.path,
      });
      const res = await fetch(`/api/speaking/getAudioURL?${params}`);
      const result = await res.json();
      setSpeakingResult(result);
      if (result.success) {
        setFetchedAudioUrl(result.data.url);
      }
    } catch {
      setSpeakingResult({ success: false, error: "Network error" });
    }
  };

  /** 播放签名 URL 音频 */
  const handlePlayFetchedAudio = async () => {
    if (!fetchedAudioUrl) return;
    try {
      const audio = new Audio(fetchedAudioUrl);
      await audio.play();
    } catch {
      setSpeakingResult({ success: false, error: "Failed to play audio" });
    }
  };

  /** 开始录音 */
  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (audioChunksRef.current.length === 0) return;
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setSttText(null);
      setSpeakingResult(null);
    } catch {
      setSpeakingResult({
        success: false,
        error: "Microphone access denied",
      });
    }
  }, []);

  /** 停止录音 */
  const handleStopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  /** 调用 STT API */
  const handleStt = async () => {
    if (!audioBlob) {
      setSpeakingResult({ success: false, error: "No recording available" });
      return;
    }
    setSpeakingResult({ loading: true, message: "Transcribing..." });
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", "en");
      const res = await fetch("/api/speaking/stt", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      setSpeakingResult(result);
      if (result.success) setSttText(result.data.text);
    } catch {
      setSpeakingResult({ success: false, error: "Network error" });
    }
  };

  /** 调用 Chat API */
  const handleChat = async () => {
    if (
      !chatForm.exerciseId ||
      !chatForm.conversationId ||
      !chatForm.message.trim()
    ) {
      setSpeakingResult({ success: false, error: "All fields are required" });
      return;
    }
    setSpeakingResult({ loading: true, message: "Sending to AI..." });
    try {
      const res = await fetch("/api/speaking/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatForm),
      });
      const result = await res.json();
      setSpeakingResult(result);
      if (result.success) {
        if (result.data?.audioBase64) {
          setLastAudioBase64(result.data.audioBase64);
        }
        if (result.data?.userMessage?.id) {
          setLastUserMessageId(result.data.userMessage.id);
        }
      }
    } catch {
      setSpeakingResult({ success: false, error: "Network error" });
    }
  };

  /** 播放 Base64 音频 */
  const handlePlayAudio = async () => {
    if (!lastAudioBase64) return;
    try {
      const binary = atob(lastAudioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch {
      setSpeakingResult({ success: false, error: "Failed to play audio" });
    }
  };

  /** 调用流式 Chat API（SSE） */
  const handleStreamChat = async () => {
    if (
      !chatForm.exerciseId ||
      !chatForm.conversationId ||
      !chatForm.message.trim()
    ) {
      setSpeakingResult({ success: false, error: "All fields are required" });
      return;
    }

    setIsStreaming(true);
    setStreamResult("");
    setStreamEvents([]);
    streamAudioQueueRef.current = [];
    isPlayingRef.current = false;

    try {
      const formData = new FormData();
      formData.append("exerciseId", chatForm.exerciseId);
      formData.append("conversationId", chatForm.conversationId);
      formData.append("message", chatForm.message);
      if (audioBlob) {
        formData.append("audio", audioBlob, "recording.webm");
      }

      const res = await fetch("/api/speaking/chat-stream", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        setSpeakingResult(err);
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 按双换行拆分 SSE 事件
        const parts = buffer.split("\n\n");
        buffer = parts.pop()!;

        for (const part of parts) {
          if (!part.trim()) continue;

          let eventType = "";
          let eventData = "";

          for (const line of part.split("\n")) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            }
            // 支持多行 data（SSE 规范）
            if (line.startsWith("data: ")) {
              eventData += (eventData ? "\n" : "") + line.slice(6);
            }
          }

          if (!eventType || !eventData) continue;

          // 跳过心跳注释行
          if (eventType.startsWith(":")) continue;

          try {
            const data = JSON.parse(eventData);
            setStreamEvents((prev) => [
              ...prev,
              { type: eventType, data, time: Date.now() },
            ]);

            switch (eventType) {
              case "text_delta":
                setStreamResult((prev) => prev + data.delta);
                break;

              case "audio_chunk":
                streamAudioQueueRef.current.push({
                  index: data.index,
                  audioBase64: data.audioBase64,
                });
                playNextAudio();
                break;

              case "message_saved":
                setLastUserMessageId(data.messageId);
                break;

              case "done":
                setIsStreaming(false);
                break;

              case "error":
                console.error("Stream error:", data.error);
                break;
            }
          } catch {
            // 跳过格式错误的 JSON
          }
        }
      }
    } catch {
      setSpeakingResult({ success: false, error: "Stream connection failed" });
    } finally {
      setIsStreaming(false);
    }
  };

  /** 按顺序播放音频队列中的下一个 chunk（MP3 格式） */
  const playNextAudio = useCallback(() => {
    if (isPlayingRef.current) return;
    const queue = streamAudioQueueRef.current;
    if (queue.length === 0) return;

    isPlayingRef.current = true;
    const { audioBase64 } = queue.shift()!;

    try {
      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        isPlayingRef.current = false;
        playNextAudio();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        isPlayingRef.current = false;
        playNextAudio();
      };
      void audio.play();
    } catch {
      isPlayingRef.current = false;
      playNextAudio();
    }
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Server Actions 测试页面</h1>
        <p className="text-muted-foreground mt-2">
          用于测试 auth、scenario、user、writing 和 speaking 模块的 Server
          Actions 与 API
        </p>
      </div>

      <Tabs defaultValue="auth" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="auth">认证模块</TabsTrigger>
          <TabsTrigger value="scenario">场景模块</TabsTrigger>
          <TabsTrigger value="user">用户模块</TabsTrigger>
          <TabsTrigger value="writing">写作模块</TabsTrigger>
          <TabsTrigger value="speaking">口语模块</TabsTrigger>
        </TabsList>

        {/* ==================== Auth Tab ==================== */}
        <TabsContent value="auth" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 注册 */}
            <Card>
              <CardHeader>
                <CardTitle>用户注册</CardTitle>
                <CardDescription>创建新用户账号</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>邮箱</Label>
                  <Input
                    value={registerForm.email}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>密码</Label>
                  <Input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        password: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>确认密码</Label>
                  <Input
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>姓名</Label>
                  <Input
                    value={registerForm.name}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, name: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleRegister} className="w-full">
                  注册
                </Button>
              </CardContent>
            </Card>

            {/* 登录 */}
            <Card>
              <CardHeader>
                <CardTitle>用户登录</CardTitle>
                <CardDescription>使用已有账号登录</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>邮箱</Label>
                  <Input
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>密码</Label>
                  <Input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleLogin} className="w-full">
                  登录
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 退出登录 */}
          <Card>
            <CardHeader>
              <CardTitle>退出登录</CardTitle>
              <CardDescription>清除当前会话</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleLogout} variant="destructive">
                退出登录
              </Button>
            </CardContent>
          </Card>

          {authResult && (
            <ResultDisplay result={authResult} title="认证操作结果" />
          )}
        </TabsContent>

        {/* ==================== Scenario Tab ==================== */}
        <TabsContent value="scenario" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>获取口语场景类型</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGetSpeakingTypes} className="w-full">
                  获取类型列表
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>获取写作场景类型</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGetWritingTypes} className="w-full">
                  获取类型列表
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>获取场景列表</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>类别 (writing/speaking)</Label>
                  <Input
                    value={scenarioFilter.category}
                    onChange={(e) =>
                      setScenarioFilter({
                        ...scenarioFilter,
                        category: e.target.value,
                      })
                    }
                  />
                </div>
                <Button onClick={handleGetScenarioList} className="w-full">
                  获取列表
                </Button>
              </CardContent>
            </Card>
          </div>

          {scenarioResult && (
            <ResultDisplay result={scenarioResult} title="场景操作结果" />
          )}
        </TabsContent>

        {/* ==================== User Tab ==================== */}
        <TabsContent value="user" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 获取用户信息 */}
            <Card>
              <CardHeader>
                <CardTitle>获取用户信息</CardTitle>
                <CardDescription>查看当前登录用户的详细信息</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGetUserProfile} className="w-full">
                  获取用户信息
                </Button>
              </CardContent>
            </Card>

            {/* 修改密码 */}
            <Card>
              <CardHeader>
                <CardTitle>修改密码</CardTitle>
                <CardDescription>更新账户密码</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>当前密码</Label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>新密码</Label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>确认新密码</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmNewPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <Button onClick={handleUpdatePassword} className="w-full">
                  修改密码
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 更新用户资料 */}
          <Card>
            <CardHeader>
              <CardTitle>更新用户资料</CardTitle>
              <CardDescription>修改个人信息和学习目标</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>姓名</Label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>英语水平</Label>
                  <Input
                    value={profileForm.englishLevel}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        englishLevel: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>学习目标</Label>
                  <Input
                    value={profileForm.learningGoal}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        learningGoal: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleUpdateProfile}>更新资料</Button>
            </CardContent>
          </Card>

          {userResult && (
            <ResultDisplay result={userResult} title="用户操作结果" />
          )}
        </TabsContent>

        {/* ==================== Writing Tab ==================== */}
        <TabsContent value="writing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 创建写作练习 */}
            <Card>
              <CardHeader>
                <CardTitle>创建写作练习</CardTitle>
                <CardDescription>创建一个新的写作练习任务</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    场景类型 (ielts_task1, ielts_task2, cet4, cet6, daily)
                  </Label>
                  <Input
                    value={createExerciseForm.scenarioType}
                    onChange={(e) =>
                      setCreateExerciseForm({
                        ...createExerciseForm,
                        scenarioType: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>是否自定义提示词</Label>
                  <Input
                    type="checkbox"
                    checked={createExerciseForm.isCustomPrompt}
                    onChange={(e) =>
                      setCreateExerciseForm({
                        ...createExerciseForm,
                        isCustomPrompt: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                </div>
                {createExerciseForm.isCustomPrompt ? (
                  <div className="space-y-2">
                    <Label>自定义提示词</Label>
                    <Textarea
                      value={createExerciseForm.prompt}
                      onChange={(e) =>
                        setCreateExerciseForm({
                          ...createExerciseForm,
                          prompt: e.target.value,
                        })
                      }
                      rows={4}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>场景ID (非自定义时必须提供)</Label>
                    <Input
                      value={createExerciseForm.scenarioId || ""}
                      onChange={(e) =>
                        setCreateExerciseForm({
                          ...createExerciseForm,
                          scenarioId: e.target.value || undefined,
                        })
                      }
                      placeholder="输入场景ID"
                    />
                  </div>
                )}
                <Button onClick={handleCreateExercise} className="w-full">
                  创建练习
                </Button>
              </CardContent>
            </Card>

            {/* 获取写作历史 */}
            <Card>
              <CardHeader>
                <CardTitle>获取写作历史</CardTitle>
                <CardDescription>查看历史写作记录</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>页码</Label>
                    <Input
                      type="number"
                      value={historyFilter.page}
                      onChange={(e) =>
                        setHistoryFilter({
                          ...historyFilter,
                          page: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>每页数量</Label>
                    <Input
                      type="number"
                      value={historyFilter.pageSize}
                      onChange={(e) =>
                        setHistoryFilter({
                          ...historyFilter,
                          pageSize: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleGetHistory} className="w-full">
                  获取历史记录
                </Button>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* 练习ID相关操作 */}
          <Card>
            <CardHeader>
              <CardTitle>练习ID</CardTitle>
              <CardDescription>输入练习ID进行后续操作</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>练习ID</Label>
                <Input
                  value={exerciseId}
                  onChange={(e) => setExerciseId(e.target.value)}
                  placeholder="输入练习ID"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleGetExercise}>获取详情</Button>
                <Button onClick={handleDeleteExercise} variant="destructive">
                  删除练习
                </Button>
                <Button onClick={handleGetResult}>获取批改结果</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 保存草稿 */}
            <Card>
              <CardHeader>
                <CardTitle>保存草稿</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>练习ID</Label>
                  <Input
                    value={draftForm.exerciseId}
                    onChange={(e) =>
                      setDraftForm({ ...draftForm, exerciseId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>内容</Label>
                  <Textarea
                    value={draftForm.content}
                    onChange={(e) => {
                      const newContent = e.target.value;
                      const wordCount = newContent.trim()
                        ? newContent.trim().split(/\s+/).length
                        : 0;
                      setDraftForm({
                        ...draftForm,
                        content: newContent,
                        wordCount,
                      });
                    }}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    字数: {draftForm.wordCount}
                  </p>
                </div>
                <Button onClick={handleSaveDraft} className="w-full">
                  保存草稿
                </Button>
              </CardContent>
            </Card>

            {/* 获取草稿 */}
            <Card>
              <CardHeader>
                <CardTitle>获取草稿</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>练习ID</Label>
                  <Input
                    value={draftForm.exerciseId}
                    onChange={(e) =>
                      setDraftForm({ ...draftForm, exerciseId: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleGetDraft} className="w-full">
                  获取草稿
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 提交写作 */}
          <Card>
            <CardHeader>
              <CardTitle>提交写作批改</CardTitle>
              <CardDescription>提交内容进行AI批改</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>练习ID</Label>
                <Input
                  value={submitForm.exerciseId}
                  onChange={(e) =>
                    setSubmitForm({ ...submitForm, exerciseId: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  场景类型 (ielts_task1, ielts_task2, cet4, cet6, daily)
                </Label>
                <Input
                  value={submitForm.scenarioType}
                  onChange={(e) =>
                    setSubmitForm({
                      ...submitForm,
                      scenarioType: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>是否自定义提示词</Label>
                <Input
                  type="checkbox"
                  checked={submitForm.isCustomPrompt}
                  onChange={(e) =>
                    setSubmitForm({
                      ...submitForm,
                      isCustomPrompt: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
              </div>
              {submitForm.isCustomPrompt && (
                <div className="space-y-2">
                  <Label>写作题目/提示词</Label>
                  <Textarea
                    value={submitForm.prompt}
                    onChange={(e) =>
                      setSubmitForm({ ...submitForm, prompt: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>写作内容（至少20个单词）</Label>
                <Textarea
                  value={submitForm.content}
                  onChange={(e) =>
                    setSubmitForm({ ...submitForm, content: e.target.value })
                  }
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  当前字数:{" "}
                  {submitForm.content.trim()
                    ? submitForm.content.trim().split(/\s+/).length
                    : 0}{" "}
                  个单词
                </p>
              </div>
              <Button onClick={handleSubmitWriting}>提交批改</Button>
            </CardContent>
          </Card>

          {writingResult && (
            <ResultDisplay result={writingResult} title="写作操作结果" />
          )}
        </TabsContent>

        {/* ==================== Speaking Tab ==================== */}
        <TabsContent value="speaking" className="space-y-4">
          {/* 创建口语练习 */}
          <Card>
            <CardHeader>
              <CardTitle>创建口语练习</CardTitle>
              <CardDescription>
                调用 startSpeakingAction 创建练习，获取 exerciseId 和
                conversationId 用于后续测试
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>场景 ID（可选，填写则使用已有场景）</Label>
                  <Input
                    value={speakingCreateForm.scenarioId}
                    onChange={(e) =>
                      setSpeakingCreateForm({
                        ...speakingCreateForm,
                        scenarioId: e.target.value,
                      })
                    }
                    placeholder="留空则使用自定义参数"
                  />
                </div>
                <div className="space-y-2">
                  <Label>场景类型（无场景ID时使用）</Label>
                  <Input
                    value={speakingCreateForm.scenarioCategory}
                    onChange={(e) =>
                      setSpeakingCreateForm({
                        ...speakingCreateForm,
                        scenarioCategory: e.target.value,
                      })
                    }
                    placeholder="free, interview, travel..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>标题</Label>
                  <Input
                    value={speakingCreateForm.title}
                    onChange={(e) =>
                      setSpeakingCreateForm({
                        ...speakingCreateForm,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>AI 角色</Label>
                  <Input
                    value={speakingCreateForm.aiRole}
                    onChange={(e) =>
                      setSpeakingCreateForm({
                        ...speakingCreateForm,
                        aiRole: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleCreateSpeakingExercise} className="w-full">
                创建练习
              </Button>
              {createdExercise && (
                <div className="rounded-md border p-3 bg-green-50 space-y-1">
                  <p className="text-sm font-medium text-green-800">
                    练习已创建
                  </p>
                  <p className="text-xs text-green-700">
                    Exercise ID:{" "}
                    <code className="bg-green-100 px-1 rounded">
                      {createdExercise.id}
                    </code>
                  </p>
                  <p className="text-xs text-green-700">
                    Conversation ID:{" "}
                    <code className="bg-green-100 px-1 rounded">
                      {createdExercise.conversationId}
                    </code>
                  </p>
                  <p className="text-xs text-green-600">
                    已自动填入下方 Chat 表单
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* STT 语音识别测试 */}
            <Card>
              <CardHeader>
                <CardTitle>STT 语音识别测试</CardTitle>
                <CardDescription>
                  录音后调用 /api/speaking/stt 进行语音转文字
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={
                      isRecording
                        ? handleStopRecording
                        : () => void handleStartRecording()
                    }
                    variant={isRecording ? "destructive" : "default"}
                  >
                    {isRecording ? "停止录音" : "开始录音"}
                  </Button>
                  <Badge variant={isRecording ? "destructive" : "secondary"}>
                    {isRecording ? "录音中..." : audioBlob ? "已录音" : "空闲"}
                  </Badge>
                </div>
                {audioBlob && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      录音大小: {(audioBlob.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const url = URL.createObjectURL(audioBlob);
                        const audio = new Audio(url);
                        audio.onended = () => URL.revokeObjectURL(url);
                        void audio.play();
                      }}
                    >
                      播放录音
                    </Button>
                  </div>
                )}
                <Button
                  onClick={handleStt}
                  disabled={!audioBlob || isRecording}
                  className="w-full"
                >
                  转写语音
                </Button>
                {sttText && (
                  <div className="rounded-md border p-3">
                    <Label className="text-xs text-muted-foreground">
                      转写结果
                    </Label>
                    <p className="mt-1 text-sm">{sttText}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* STT 文件测试（录音文件识别极速版） */}
            <Card>
              <CardHeader>
                <CardTitle>STT 文件测试</CardTitle>
                <CardDescription>
                  调用 /api/speaking/test-stt 对服务端音频文件进行 STT
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      setSpeakingResult({
                        loading: true,
                        message: "Testing output.wav...",
                      });
                      try {
                        const res = await fetch("/api/speaking/test-stt", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            filename: "output.wav",
                            language: "en",
                          }),
                        });
                        const result = await res.json();
                        setSpeakingResult(result);
                        if (result.success) setSttText(result.data.text);
                      } catch {
                        setSpeakingResult({
                          success: false,
                          error: "Network error",
                        });
                      }
                    }}
                    variant="outline"
                  >
                    output.wav（短音频，一句话识别）
                  </Button>
                  <Button
                    onClick={async () => {
                      setSpeakingResult({
                        loading: true,
                        message: "Testing sample-speech-5m.mp3...",
                      });
                      try {
                        const res = await fetch("/api/speaking/test-stt", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            filename: "sample-speech-5m.mp3",
                            language: "en",
                          }),
                        });
                        const result = await res.json();
                        setSpeakingResult(result);
                        if (result.success) setSttText(result.data.text);
                      } catch {
                        setSpeakingResult({
                          success: false,
                          error: "Network error",
                        });
                      }
                    }}
                    variant="outline"
                  >
                    sample-speech-5m.mp3（长音频，录音文件识别极速版）
                  </Button>
                </div>
                {sttText && (
                  <div className="rounded-md border p-3">
                    <Label className="text-xs text-muted-foreground">
                      转写结果
                    </Label>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {sttText}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat 对话测试 */}
            <Card>
              <CardHeader>
                <CardTitle>Chat 对话测试</CardTitle>
                <CardDescription>
                  调用 /api/speaking/chat 发送消息（需提供 exerciseId 和
                  conversationId）
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Exercise ID</Label>
                  <Input
                    value={chatForm.exerciseId}
                    onChange={(e) =>
                      setChatForm({ ...chatForm, exerciseId: e.target.value })
                    }
                    placeholder="输入练习 ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conversation ID</Label>
                  <Input
                    value={chatForm.conversationId}
                    onChange={(e) =>
                      setChatForm({
                        ...chatForm,
                        conversationId: e.target.value,
                      })
                    }
                    placeholder="输入会话 ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>消息内容</Label>
                  <Textarea
                    value={chatForm.message}
                    onChange={(e) =>
                      setChatForm({ ...chatForm, message: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <Button onClick={handleChat} className="w-full">
                  发送消息
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 流式 Chat 测试（SSE） */}
          <Card>
            <CardHeader>
              <CardTitle>Chat 流式对话测试 (SSE)</CardTitle>
              <CardDescription>
                调用 /api/speaking/chat-stream，体验流式 AI 回复 + 实时 TTS
                音频播放
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleStreamChat}
                  disabled={isStreaming}
                  className="w-full"
                >
                  {isStreaming ? "流式传输中..." : "流式发送"}
                </Button>
                <Badge variant={isStreaming ? "destructive" : "secondary"}>
                  {isStreaming ? "streaming" : "idle"}
                </Badge>
              </div>

              {/* 实时文本 */}
              {streamResult && (
                <div className="rounded-md border p-3 bg-slate-50">
                  <Label className="text-xs text-muted-foreground">
                    AI 回复（实时）
                  </Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {streamResult}
                  </p>
                </div>
              )}

              {/* 统计信息 */}
              {streamEvents.length > 0 && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>
                    事件数:{" "}
                    {streamEvents.filter((e) => e.type !== "done").length}
                  </span>
                  <span>
                    音频块:{" "}
                    {
                      streamEvents.filter((e) => e.type === "audio_chunk")
                        .length
                    }
                  </span>
                  <span>
                    句子数:{" "}
                    {streamEvents.filter((e) => e.type === "sentence").length}
                  </span>
                  {streamEvents.length >= 2 &&
                    streamEvents[0] &&
                    streamEvents[streamEvents.length - 1] && (
                      <span>
                        耗时:{" "}
                        {(
                          (streamEvents[streamEvents.length - 1]!.time -
                            streamEvents[0]!.time) /
                          1000
                        ).toFixed(1)}
                        s
                      </span>
                    )}
                </div>
              )}

              {/* 事件日志 */}
              {streamEvents.length > 0 && (
                <ResultDisplay result={streamEvents} title="SSE 事件日志" />
              )}
            </CardContent>
          </Card>

          {/* 音频播放 */}
          {lastAudioBase64 && (
            <Card>
              <CardHeader>
                <CardTitle>AI 语音播放</CardTitle>
                <CardDescription>上一次 Chat 响应中的 TTS 音频</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => void handlePlayAudio()}>
                  播放 AI 语音
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  音频大小: ~
                  {((lastAudioBase64.length * 0.75) / 1024).toFixed(0)} KB
                </p>
              </CardContent>
            </Card>
          )}

          {/* 获取 message 音频（Supabase Storage） */}
          <Card>
            <CardHeader>
              <CardTitle>获取 Message 音频</CardTitle>
              <CardDescription>
                通过 GET /api/speaking/getAudioURL 获取签名 URL 并播放
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bucket</Label>
                <select
                  value={audioUrlForm.bucket}
                  onChange={(e) =>
                    setAudioUrlForm({ ...audioUrlForm, bucket: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="user-audio">user-audio</option>
                  <option value="ai-audio">ai-audio</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>
                  Path（格式: {`{userId}/{conversationId}/{messageId}.ext`}）
                </Label>
                <Input
                  value={audioUrlForm.path}
                  onChange={(e) =>
                    setAudioUrlForm({ ...audioUrlForm, path: e.target.value })
                  }
                  placeholder="user123/conv456/msg789.webm"
                />
              </div>
              <Button onClick={handleGetAudioUrl} className="w-full">
                获取音频 URL
              </Button>
              {fetchedAudioUrl && (
                <div className="space-y-2 rounded-md border p-3 bg-green-50">
                  <p className="text-xs text-green-800">签名 URL 已生成</p>
                  <p className="text-xs text-green-700 break-all">
                    {fetchedAudioUrl.substring(0, 100)}...
                  </p>
                  <Button
                    onClick={() => void handlePlayFetchedAudio()}
                    variant="outline"
                    size="sm"
                  >
                    播放音频
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 发音评估测试 */}
          {audioBlob && sttText && (
            <Card>
              <CardHeader>
                <CardTitle>发音评估测试</CardTitle>
                <CardDescription>
                  将录音和确认后的文本发送到 Azure Pronunciation Assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border p-3 bg-slate-50">
                  <p className="text-xs text-muted-foreground">参考文本</p>
                  <p className="text-sm mt-1">{sttText}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    音频: {(audioBlob.size / 1024).toFixed(1)} KB
                  </p>
                  {lastUserMessageId && (
                    <p className="text-xs text-green-700 mt-1">
                      关联消息: {lastUserMessageId}
                    </p>
                  )}
                </div>
                <Button
                  onClick={async () => {
                    setSpeakingResult({
                      loading: true,
                      message: "Assessing pronunciation...",
                    });
                    try {
                      const formData = new FormData();
                      formData.append("audio", audioBlob, "recording.webm");
                      formData.append("referenceText", sttText);
                      if (lastUserMessageId) {
                        formData.append("messageId", lastUserMessageId);
                      }
                      const res = await fetch("/api/speaking/pronunciation", {
                        method: "POST",
                        body: formData,
                      });
                      const result = await res.json();
                      setSpeakingResult(result);
                    } catch {
                      setSpeakingResult({
                        success: false,
                        error: "Network error",
                      });
                    }
                  }}
                  className="w-full"
                >
                  评估发音
                </Button>
              </CardContent>
            </Card>
          )}

          {/* AI Review 测试 */}
          <Card>
            <CardHeader>
              <CardTitle>AI Review 测试</CardTitle>
              <CardDescription>
                调用 /api/speaking/review 对练习进行 AI 评估并自动保存
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Exercise ID</Label>
                <Input
                  value={reviewForm.exerciseId}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      exerciseId: e.target.value,
                    })
                  }
                  placeholder="输入练习 ID"
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={reviewForm.score}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        score: e.target.checked,
                      })
                    }
                  />
                  score（总分）
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={reviewForm.words}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        words: e.target.checked,
                      })
                    }
                  />
                  words（逐词）
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={reviewForm.phonemes}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        phonemes: e.target.checked,
                      })
                    }
                  />
                  phonemes（音素）
                </label>
              </div>
              <Button onClick={handleReview} className="w-full">
                生成 AI Review
              </Button>
            </CardContent>
          </Card>

          {/* 本地音频发音评估 */}
          <Card>
            <CardHeader>
              <CardTitle>本地音频发音评估</CardTitle>
              <CardDescription>
                读取 outputAudio/output.wav，STT 转写后调用 Azure 发音评估
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={async () => {
                  setSpeakingResult({
                    loading: true,
                    message: "Assessing local audio...",
                  });
                  try {
                    const res = await fetch(
                      "/api/speaking/pronunciation-local",
                      {
                        method: "POST",
                      },
                    );
                    const result = await res.json();
                    setSpeakingResult(result);
                  } catch {
                    setSpeakingResult({
                      success: false,
                      error: "Network error",
                    });
                  }
                }}
                className="w-full"
              >
                评估本地音频
              </Button>
            </CardContent>
          </Card>

          {speakingResult && (
            <ResultDisplay result={speakingResult} title="口语 API 结果" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
