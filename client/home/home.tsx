 import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/user-context";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import {
  useGetStudentProgress, getGetStudentProgressQueryKey,
  useGetStudentStreak,   getGetStudentStreakQueryKey,
  useGetStudentPathway,  getGetStudentPathwayQueryKey,
} from "@/api-generated";
import { useSpokenContent } from "@/hooks/use-spoken-content";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useShowCapsule } from "@/components/app-shell";
import { Home as HomeIcon } from "lucide-react";
import { LoadingScreen } from "@/components/loading-screen";
import confetti from "canvas-confetti";

import type { AnswerRecord, View } from "./home-types";
import { DOMAIN_CONFIG, domainLabel, resolveSessionStartFromUiKey } from "./home-types";
import { SessionProvider, type SessionData } from "./session-context";
import { ImageLibrarySession } from "./components/image-library-session";
import type { ItemFeedbackPayload } from "./components/item-coaching-card";
import type { DomainProgress, SessionPoint } from "./components/domain-charts";
import { HomeDashboardView }   from "./components/home-dashboard-view";
import { SessionLoadingView }  from "./components/session-loading-view";
import { SessionErrorView }    from "./components/session-error-view";
import { SessionCompleteView } from "./components/session-complete-view";
import { SessionActiveView }   from "./components/session-active-view";
import { useBreadcrumbTrail, type Crumb } from "@/components/breadcrumbs";

export default function Home() {
  const {
    studentId,
    student: studentData,
    studentData: fullStudentData,
    isStudentLoading: loadingStudent,
    refetchStudent,
    ready: authReady,
  } = useUser();
  const { request }   = useApi();
  const showCapsule   = useShowCapsule();
  const [, setLocation] = useLocation();

  // ─── View state ───────────────────────────────────────────────────────────
  const [view, setView]               = useState<View>("home");
  const [activeDomain, setActiveDomain] = useState("");
  const [session, setSession]         = useState<any>(null);
  const [errorMsg, setErrorMsg]       = useState("");

  // ─── Question state ───────────────────────────────────────────────────────
  const [qIdx, setQIdx]                   = useState(0);
  const [answers, setAnswers]             = useState<AnswerRecord[]>([]);
  const [showFeedback, setShowFeedback]   = useState(false);
  const [lastCorrect, setLastCorrect]     = useState(false);
  const [selectedIdx, setSelectedIdx]     = useState(-1);
  const [writingText, setWritingText]     = useState("");
  const [recording, setRecording]         = useState(false);
  const [finalizingSpeaking, setFinalizingSpeaking] = useState(false);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [listenedOnce, setListenedOnce]   = useState(false);
  const [productionReview, setProductionReview] = useState<{
    kind: "speaking" | "writing";
    text: string;
    feedback: ItemFeedbackPayload | null;
    loading: boolean;
  } | null>(null);
  const sessionStartTime = useRef<number>(0);
  const speakingCoachRef = useRef<{
    tryCount: number;
    lastJudgment?: ItemFeedbackPayload["judgment"];
    lastCoachTip: string;
  }>({ tryCount: 0, lastCoachTip: "" });
  const writingCoachRef = useRef<{
    tryCount: number;
    lastJudgment?: ItemFeedbackPayload["judgment"];
    lastCoachTip: string;
    lastStudentAnswer: string;
  }>({ tryCount: 0, lastCoachTip: "", lastStudentAnswer: "" });

  // ─── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (authReady && !studentId) setLocation("/");
  }, [authReady, studentId, setLocation]);

  // ─── Remote data ──────────────────────────────────────────────────────────
  const { data: progressData, isLoading: loadingProgress, refetch: refetchProgress } =
    useGetStudentProgress(studentId || "", {
      query: { enabled: !!studentId, queryKey: getGetStudentProgressQueryKey(studentId || "") },
    });

  const { data: streakData, refetch: refetchStreak } =
    useGetStudentStreak(studentId || "", {
      query: { enabled: !!studentId, queryKey: getGetStudentStreakQueryKey(studentId || "") },
    });

  const { data: pathwayData } =
    useGetStudentPathway(studentId || "", {
      query: { enabled: !!studentId, queryKey: getGetStudentPathwayQueryKey(studentId || "") },
    });

  // ─── Auto-start from ?domain= query param (e.g. from /listening page) ──────
  useEffect(() => {
    if (!studentId || view !== "home" || loadingProgress) return;
    const params = new URLSearchParams(window.location.search);
    const autoDomain = params.get("domain");
    if (!autoDomain) return;
    window.history.replaceState({}, "", window.location.pathname);
    startSession(autoDomain);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, view, loadingProgress]);

  // ─── TTS / STT ────────────────────────────────────────────────────────────
  const { isSpeaking: speaking, isLoadingTts: ttsLoading, speakPassage, speakFeedback, stopSpeaking } =
    useSpokenContent({ onEnd: () => setListenedOnce(true) });

  // Auto-play spoken support once per session:
  // listening = the passage; speaking/writing = the on-screen prompt.
  // Reading is never auto-played — the student must read the print themselves.
  const autoPlaySessionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!session) return;
    const kind = session.content?.type;
    if (kind === "reading") return;
    const data = session.content?.data;
    const spoken =
      kind === "listening"
        ? (data?.audioScript ?? "")
        : kind === "speaking" || kind === "writing"
          ? [data?.prompt, data?.scaffold].filter(Boolean).join(". ")
          : "";
    if (!spoken) return;
    const sessionId: string = session.sessionId;
    if (autoPlaySessionRef.current === sessionId) return;
    autoPlaySessionRef.current = sessionId;
    speakPassage(spoken);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.sessionId]);

  const {
    isSupported: sttSupported,
    isListening: sttListening,
    isTranscribing: sttTranscribing,
    transcript: sttTranscript,
    interimTranscript: sttInterim,
    inputLevel: sttLevel,
    error: sttError,
    uncertainWords: sttUncertainWords,
    lastConfidence: sttConfidence,
    startListening: startSttListening,
    stopListening: stopSttListening,
    resetTranscript: resetSttTranscript,
  } = useSpeechToText();

  // ─── Session lifecycle ────────────────────────────────────────────────────
  const startSession = useCallback(async (domain: string) => {
    setActiveDomain(domain);
    setQIdx(0);
    setAnswers([]);
    setShowFeedback(false);
    setSelectedIdx(-1);
    setWritingText("");
    setRecording(false);
    resetSttTranscript();
    setSession(null);
    setSessionResult(null);
    setProductionReview(null);
    setListenedOnce(false);
    speakingCoachRef.current = { tryCount: 0, lastCoachTip: "" };
    writingCoachRef.current = { tryCount: 0, lastCoachTip: "", lastStudentAnswer: "" };
    stopSpeaking();
    setView("loading");
    try {
      const { apiDomain, tier } = resolveSessionStartFromUiKey(domain);
      const raw = await request<Record<string, unknown>>(`/api/students/${studentId}/sessions/start`, {
        method: "POST",
        body: JSON.stringify({ domain: apiDomain, tier, sessionType: "single" }),
      });
      const content = raw.content as SessionData["content"] | undefined;
      const anchor = raw.anchorImage as SessionData["anchorImage"];
      const inner = content?.data;
      const illustrationUrl =
        inner?.illustrationUrl
        ?? (typeof anchor?.url === "string" ? anchor.url : undefined);
      const data: SessionData = {
        ...(raw as SessionData),
        anchorImage: anchor ?? null,
        content: content
          ? {
              ...content,
              data: inner
                ? {
                    ...inner,
                    illustrationUrl,
                    imageTags: inner.imageTags ?? inner.tags ?? anchor?.tags,
                    tags: inner.tags ?? anchor?.tags,
                  }
                : inner,
            }
          : content!,
      };
      setSession(data);
      sessionStartTime.current = Date.now();
      setView("session");
    } catch (err) {
      console.error("Session start failed:", err);
      setErrorMsg(extractErrorMessage(err, "Could not start session"));
      setView("error");
    }
  }, [studentId, request, resetSttTranscript, stopSpeaking]);

  const completeSession = useCallback(async (overrideAnswers?: AnswerRecord[]) => {
    if (!session) return;
    stopSpeaking();
    setView("finishing");

    const finalAnswers  = overrideAnswers ?? answers;
    const questions     = session.content?.data?.questions || [];
    const correctCount  = finalAnswers.filter(a => a.correct).length;
    const total         = questions.length || 1;
    const scorePct      = total > 0 ? (correctCount / total) * 100 : 80;
    const durationSeconds = Math.round((Date.now() - sessionStartTime.current) / 1000) || 600;

    const weakTypes: string[] = [];
    finalAnswers.forEach((a, i) => {
      if (!a.correct && questions[i]) {
        const qType = questions[i].type || questions[i].skill || `q${i + 1}`;
        if (!weakTypes.includes(qType)) weakTypes.push(qType);
      }
    });

    try {
      const topic: string | undefined = session.content?.data?.topic;
      const data = await request(`/api/students/${studentId}/sessions/${session.sessionId}/complete`, {
        method: "POST",
        body: JSON.stringify({ scorePct, durationSeconds, weakTypes, answers: finalAnswers, topic }),
      });
      setSessionResult(data);
    } catch (err) {
      console.error("Session complete failed:", err);
      setErrorMsg(extractErrorMessage(err, "Could not save your session results. Please try again."));
      setView("error");
      return;
    }

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setView("complete");
    refetchProgress();
    refetchStreak();
    refetchStudent();
  }, [session, answers, studentId, refetchProgress, refetchStreak, refetchStudent, stopSpeaking, request]);

  const loadItemFeedback = useCallback(async (body: Record<string, unknown>) => {
    if (!studentId) return null;
    try {
      return await request<ItemFeedbackPayload>(`/api/students/${studentId}/item-feedback`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    } catch {
      return null;
    }
  }, [studentId, request]);

  useEffect(() => {
    if (!finalizingSpeaking) return;
    if (sttListening || sttTranscribing) return;

    const spoken = /^[.\s…]*$/.test(sttTranscript.trim()) ? "" : sttTranscript.trim();
    const data = session?.content?.data;
    setFinalizingSpeaking(false);

    if (!spoken) {
      setProductionReview({
        kind: "speaking",
        text: "",
        feedback: {
          headline: "Try speaking again",
          whyWrong: "",
          correctAnswer: "",
          objectClue: "",
          modelResponse: "",
          howToSayIt: "",
          keepInMind: [],
          tryAgainTip: "",
          spokenText: sttError || "I did not catch that. Tap to speak again. Use the starter on the screen.",
          judgment: "rejected",
          meetsTask: false,
        },
        loading: false,
      });
      return;
    }

    setProductionReview({ kind: "speaking", text: spoken, feedback: null, loading: true });
    speakingCoachRef.current.tryCount += 1;
    void loadItemFeedback({
      domain: "speaking",
      level: Number(session?.levelStart ?? 1),
      format: "speaking",
      question: data?.prompt ?? "",
      studentAnswer: spoken,
      prompt: data?.prompt,
      scaffold: data?.scaffold,
      canDo: data?.canDoDescriptor,
      keyUse: session?.keyUse ?? data?.keyUse,
      canDoAction: data?.canDoAction,
      canDoItems: data?.canDoItems,
      responseLength: data?.responseLength,
      imageTags: data?.imageTags ?? data?.tags,
      imageDescription: data?.imageDescription || undefined,
      sttConfidence: sttConfidence,
      uncertainWords: sttUncertainWords,
      tryCount: speakingCoachRef.current.tryCount,
      lastJudgment: speakingCoachRef.current.lastJudgment,
      lastCoachTip: speakingCoachRef.current.lastCoachTip || undefined,
    }).then((feedback) => {
      if (feedback) {
        speakingCoachRef.current.lastJudgment = feedback.judgment;
        speakingCoachRef.current.lastCoachTip = feedback.tryAgainTip || feedback.spokenText || "";
      }
      setProductionReview({ kind: "speaking", text: spoken, feedback, loading: false });
    });
  }, [finalizingSpeaking, sttListening, sttTranscribing, sttTranscript, sttError, sttConfidence, sttUncertainWords, session, loadItemFeedback]);

  const onContinueProduction = () => {
    if (!productionReview || !session) return;
    const rec: AnswerRecord = {
      question: session.content?.data?.prompt ?? "",
      content: session.content?.data,
      submittedAnswer: productionReview.text,
      correct: productionReview.feedback?.meetsTask ?? false,
    };
    setAnswers([rec]);
    setProductionReview(null);
    completeSession([rec]);
  };

  const onRetryProduction = () => {
    setProductionReview(null);
    resetSttTranscript();
    setRecording(false);
    setFinalizingSpeaking(false);
  };

  // ─── Question handlers ────────────────────────────────────────────────────
  const questions = session?.content?.data?.questions ?? [];
  const currentQ  = questions[qIdx];

  const handleAnswer = (idx: number) => {
    if (showFeedback) return;
    setSelectedIdx(idx);
    const correct = currentQ?.correct === idx;
    setLastCorrect(correct);
    setShowFeedback(true);
    setAnswers(prev => [...prev, {
      question: currentQ?.question ?? "",
      content: currentQ,
      submittedAnswer: currentQ?.options?.[idx] ?? idx,
      correct,
    }]);
  };

  const handleAnswerNonMC = (submittedAnswer: unknown, isCorrect: boolean) => {
    if (showFeedback) return;
    setLastCorrect(isCorrect);
    setShowFeedback(true);
    setAnswers(prev => [...prev, {
      question: currentQ?.question ?? "",
      content: currentQ,
      submittedAnswer: typeof submittedAnswer === "string" ? submittedAnswer : JSON.stringify(submittedAnswer),
      correct: isCorrect,
    }]);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedIdx(-1);
    setListenedOnce(false);
    stopSpeaking();
    if (qIdx < questions.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      completeSession();
    }
  };

  const handleRetryQuestion = () => {
    setAnswers((prev) => prev.slice(0, -1));
    setShowFeedback(false);
    setSelectedIdx(-1);
    setLastCorrect(false);
  };

  // ─── Demo jump (must be before any early return to satisfy Rules of Hooks) ──
  const handleDemoJump = useCallback(async (domain: string, level: number) => {
    if (!studentId) return;
    await request(`/api/students/${studentId}/demo-jump`, {
      method: "POST",
      body: JSON.stringify({ domain, level }),
    });
    await refetchProgress();
  }, [studentId, request, refetchProgress]);

  // ─── Shared helpers ───────────────────────────────────────────────────────
  const sessionTrail = (domain: string): Crumb[] => {
    const c = DOMAIN_CONFIG[domain] ?? DOMAIN_CONFIG.listening;
    return [
      { label: "Practice", icon: HomeIcon, onClick: () => setView("home") },
      { label: domainLabel(domain), icon: c.icon },
    ];
  };

  useBreadcrumbTrail(view === "home" ? undefined : sessionTrail(activeDomain));

  // ─── Global loading guard ─────────────────────────────────────────────────
  if (!studentId || loadingStudent || loadingProgress) {
    return (
      <LoadingScreen />
    );
  }

  // ─── Domain progress shape for charts ────────────────────────────────────
  const domains: DomainProgress[] = (progressData?.domains ?? []).map(d => {
    const ext = d as typeof d & { scaleMin?: number; scaleMax?: number; sessionHistory?: SessionPoint[] };
    return {
      domain:       d.domain,
      currentLevel: d.currentLevel,
      exitThreshold: d.exitThreshold,
      levelLabel:   d.levelLabel,
      scaleMin:     ext.scaleMin ?? 1,
      scaleMax:     ext.scaleMax ?? 6,
      sessionHistory: ext.sessionHistory ?? [],
    };
  });

  if (view === "home") {
    return (
      <HomeDashboardView
        studentName={studentData?.name ?? ""}
        avatarUrl={studentData?.avatarUrl}
        totalXp={streakData?.totalXp ?? 0}
        currentStreak={streakData?.currentStreak ?? 0}
        rank={streakData?.rank ?? "Newcomer"}
        nextRankXp={streakData?.nextRankXp ?? 100}
        domains={domains}
        nudgeMessage={pathwayData?.nudgeMessage}
        canPractice={fullStudentData?.canPractice !== false}
        accessReason={fullStudentData?.accessReason}
        showCapsule={showCapsule}
        onStartSession={startSession}
        onNavigateBilling={() => setLocation("/billing")}
        onDemoJump={handleDemoJump}
      />
    );
  }

  if (view === "loading") {
    return <SessionLoadingView domain={activeDomain} />;
  }

  if (view === "finishing") {
    return <LoadingScreen fullHeight={false} message="Reviewing your answers" />;
  }

  if (view === "error") {
    return (
      <SessionErrorView
        errorMsg={errorMsg}
        onBack={() => setView("home")}
        onRetry={() => startSession(activeDomain)}
      />
    );
  }

  if (view === "complete") {
    return (
      <SessionCompleteView
        answers={answers}
        sessionResult={sessionResult}
        onContinue={() => setView("home")}
      />
    );
  }

  // view === "session"
  if (!session?.content?.data) {
    return (
      <SessionErrorView
        errorMsg="This practice session could not be loaded. Please try again."
        onBack={() => setView("home")}
        onRetry={() => startSession(activeDomain)}
      />
    );
  }

  // image_library (levels 0–2) bypasses the regular session pipeline
  if (session.content.type === "image_library") {
    return (
      <ImageLibrarySession
        data={{
          ...session.content.data,
          keyUse: session.keyUse ?? session.content.data?.keyUse,
        }}
        studentId={studentId ?? undefined}
        level={Number(session.levelStart ?? 1)}
        speakPassage={speakPassage}
        speakFeedback={speakFeedback}
        isSpeaking={speaking}
        isLoadingTts={ttsLoading}
        stopSpeaking={stopSpeaking}
        onComplete={(imageAnswers) => {
          stopSpeaking();
          setAnswers(imageAnswers);
          completeSession(imageAnswers);
        }}
      />
    );
  }

  // view === "session" — AI-generated content (levels 3–6)
  return (
    <SessionProvider value={{
      session,
      activeDomain,
      qIdx,
      questions,
      currentQ,
      showFeedback,
      lastCorrect,
      selectedIdx,
      listenedOnce,
      onAnswer:      handleAnswer,
      onAnswerNonMC: handleAnswerNonMC,
      onNext:        handleNext,
      onRetryQuestion: handleRetryQuestion,
      speaking,
      ttsLoading,
      speakPassage,
      speakFeedback,
      onSpeak:        speakPassage,
      onStopSpeaking: stopSpeaking,
      sttSupported,
      sttTranscript,
      sttInterim,
      sttLevel,
      sttError: sttError ?? "",
      recording,
      finalizingSpeaking,
      onStartRecording: () => {
        stopSpeaking();
        setRecording(true);
        resetSttTranscript();
        if (sttSupported) startSttListening();
      },
      onStopRecording:  () => { setRecording(false); setFinalizingSpeaking(true); stopSttListening(); },
      studentLevel: Number(session?.levelStart ?? 1),
      productionReview,
      onContinueProduction,
      onRetryProduction,
      writingText,
      setWritingText,
      onSubmitWriting: (text) => {
        const data = session?.content?.data;
        writingCoachRef.current.tryCount += 1;
        setProductionReview({ kind: "writing", text, feedback: null, loading: true });
        void loadItemFeedback({
          domain: "writing",
          level: Number(session?.levelStart ?? 1),
          format: "writing",
          question: data?.prompt ?? "",
          studentAnswer: text,
          prompt: data?.prompt,
          scaffold: data?.sentenceFrame ?? data?.sentence_frame,
          canDo: data?.canDoDescriptor,
          imageTags: data?.imageTags ?? data?.tags,
          imageDescription: data?.imageDescription || undefined,
          minSentences: data?.minSentences,
          options: data?.wordBank ?? data?.word_bank,
          tryCount: writingCoachRef.current.tryCount,
          lastJudgment: writingCoachRef.current.lastJudgment,
          lastCoachTip: writingCoachRef.current.lastCoachTip || undefined,
          lastStudentAnswer: writingCoachRef.current.lastStudentAnswer || undefined,
        }).then((feedback) => {
          writingCoachRef.current.lastStudentAnswer = text;
          if (feedback) {
            writingCoachRef.current.lastJudgment = feedback.judgment;
            writingCoachRef.current.lastCoachTip = feedback.tryAgainTip || feedback.spokenText || "";
          }
          setProductionReview({ kind: "writing", text, feedback, loading: false });
        });
      },
    }}>
      <SessionActiveView
        showCapsule={showCapsule}
      />
    </SessionProvider>
  );
}
