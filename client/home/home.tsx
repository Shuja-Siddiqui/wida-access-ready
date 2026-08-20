 import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/user-context";
import { useApi, extractErrorMessage } from "@/hooks/use-api";
import {
  useGetStudentProgress, getGetStudentProgressQueryKey,
  useGetStudentStreak,   getGetStudentStreakQueryKey,
  useGetStudentPathway,  getGetStudentPathwayQueryKey,
} from "@/api-generated";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useShowCapsule } from "@/components/app-shell";
import { Home as HomeIcon } from "lucide-react";
import confetti from "canvas-confetti";

import type { AnswerRecord, View } from "./home-types";
import { DOMAIN_CONFIG, domainLabel } from "./home-types";
import { SessionProvider } from "./session-context";
import { ImageLibrarySession } from "./components/image-library-session";
import type { DomainProgress, SessionPoint } from "./components/domain-charts";
import { HomeDashboardView }   from "./components/home-dashboard-view";
import { SessionLoadingView }  from "./components/session-loading-view";
import { SessionErrorView }    from "./components/session-error-view";
import { SessionCompleteView } from "./components/session-complete-view";
import { SessionActiveView }   from "./components/session-active-view";
import type { Crumb } from "@/components/breadcrumbs";

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
  const sessionStartTime = useRef<number>(0);

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
  const { isSpeaking: speaking, isLoading: ttsLoading, speak: speakText, stop: stopSpeaking } =
    useTextToSpeech({ onEnd: () => setListenedOnce(true) });

  // Auto-play the listening passage once when a new session starts.
  // Lives here (not in SessionAudioPlayer) so React StrictMode's double-mount
  // of child components cannot trigger a second simultaneous TTS request.
  // Only the passage is spoken — question text is displayed on screen and not
  // read aloud; the student can replay manually via the player button.
  const autoPlaySessionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!session || session.content?.type !== "listening") return;
    const audioScript: string = session.content?.data?.audioScript ?? "";
    if (!audioScript) return;
    const sessionId: string = session.sessionId;
    if (autoPlaySessionRef.current === sessionId) return; // already played this session
    autoPlaySessionRef.current = sessionId;
    speakText(audioScript);
  // speakText is intentionally omitted — we want exactly one fire per sessionId,
  // not a re-fire if speakText reference updates while azureAvailable resolves.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.sessionId]);

  const {
    isSupported: sttSupported,
    isListening: sttListening,
    isTranscribing: sttTranscribing,
    transcript: sttTranscript,
    interimTranscript: sttInterim,
    error: sttError,
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
    setListenedOnce(false);
    stopSpeaking();
    setView("loading");
    try {
      // Map the UI domain key (e.g. "listening_academic") → { apiDomain, tier } for the API.
      const cfg       = DOMAIN_CONFIG[domain];
      const apiDomain = cfg?.apiDomain ?? domain;
      const tier      = cfg?.tier ?? "general";
      const data = await request(`/api/students/${studentId}/sessions/start`, {
        method: "POST",
        body: JSON.stringify({ domain: apiDomain, tier, sessionType: "single" }),
      });
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
    }

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setView("complete");
    refetchProgress();
    refetchStreak();
    refetchStudent();
  }, [session, answers, studentId, refetchProgress, refetchStreak, refetchStudent, stopSpeaking, request]);

  // Finalize speaking answer after transcription completes
  useEffect(() => {
    if (!finalizingSpeaking || sttTranscribing) return;
    const spoken = sttTranscript.trim();
    const finalAnswers: AnswerRecord[] = [{
      question: session?.content?.data?.prompt || "",
      content:  session?.content?.data,
      submittedAnswer: spoken || "(spoken response — not transcribed)",
      correct: true,
    }];
    setAnswers(finalAnswers);
    setFinalizingSpeaking(false);
    completeSession(finalAnswers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalizingSpeaking, sttTranscribing]);

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

  // ─── Global loading guard ─────────────────────────────────────────────────
  if (!studentId || loadingStudent || loadingProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full bg-primary" />
      </div>
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
    return <SessionLoadingView trail={sessionTrail(activeDomain)} domain={activeDomain} />;
  }

  if (view === "error") {
    return (
      <SessionErrorView
        trail={sessionTrail(activeDomain)}
        errorMsg={errorMsg}
        onBack={() => setView("home")}
        onRetry={() => startSession(activeDomain)}
      />
    );
  }

  if (view === "complete") {
    return (
      <SessionCompleteView
        trail={sessionTrail(activeDomain)}
        answers={answers}
        sessionResult={sessionResult}
        onContinue={() => setView("home")}
      />
    );
  }

  // view === "session" — image_library (levels 0–2) bypasses the regular session pipeline
  if (session?.content?.type === "image_library") {
    return (
      <ImageLibrarySession
        data={session.content.data}
        speakText={speakText}
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
      speaking,
      onSpeak:        speakText,
      onStopSpeaking: stopSpeaking,
      sttSupported,
      sttTranscript,
      sttInterim,
      sttError: sttError ?? "",
      recording,
      finalizingSpeaking,
      onStartRecording: () => { setRecording(true); resetSttTranscript(); if (sttSupported) startSttListening(); },
      onStopRecording:  () => { setRecording(false); setFinalizingSpeaking(true); stopSttListening(); },
      writingText,
      setWritingText,
      onSubmitWriting: (text) => {
        setAnswers([{ question: session?.content?.data?.prompt ?? "", content: session?.content?.data, submittedAnswer: text, correct: true }]);
        completeSession();
      },
    }}>
      <SessionActiveView
        trail={sessionTrail(activeDomain)}
        showCapsule={showCapsule}
      />
    </SessionProvider>
  );
}
