import { motion, AnimatePresence } from "framer-motion";
import type { AnyQuestion, QuestionAnswer } from "./types";
import { MultipleChoice }       from "./components/multiple-choice";
import { ImageHotspot }         from "./components/image-hotspot";
import { FillInBlank }          from "./components/fill-in-blank";
import { ShortAnswer }          from "./components/short-answer";
import { WordBank }             from "./components/word-bank";
import { SentenceFrame }        from "./components/sentence-frame";
import { ListeningMC }          from "./components/listening-mc";
import { ListeningTrueFalse }   from "./components/listening-true-false";
import { ListeningImageGrid }   from "./components/listening-image-grid";
import { ListeningSequence }    from "./components/listening-sequence";
import { ListeningMatch }       from "./components/listening-match";
import { ListeningClassify }    from "./components/listening-classify";
import { SpeakingPrompt }       from "./components/speaking-prompt";
import { ImageDescribe }        from "./components/image-describe";
import { SequenceOrder }        from "./components/sequence-order";
import { MatchColumns }         from "./components/match-columns";

interface Props {
  question: AnyQuestion;
  questionNumber?: number;
  totalQuestions?: number;
  onAnswer: (answer: QuestionAnswer) => void;
  showResult?: boolean;
}

const DOMAIN_META: Record<string, { label: string; color: string; bg: string }> = {
  multiple_choice:     { label: "Reading",   color: "hsl(14 86% 57%)",   bg: "hsl(14 86% 57% / .12)"   },
  image_hotspot:       { label: "Reading",   color: "hsl(14 86% 57%)",   bg: "hsl(14 86% 57% / .12)"   },
  fill_in_blank:       { label: "Reading",   color: "hsl(14 86% 57%)",   bg: "hsl(14 86% 57% / .12)"   },
  short_answer:        { label: "Writing",   color: "hsl(286 70% 58%)",  bg: "hsl(286 70% 58% / .12)"  },
  word_bank:           { label: "Writing",   color: "hsl(286 70% 58%)",  bg: "hsl(286 70% 58% / .12)"  },
  sentence_frame:      { label: "Writing",   color: "hsl(286 70% 58%)",  bg: "hsl(286 70% 58% / .12)"  },
  listening_mc:        { label: "Listening", color: "hsl(338 100% 65%)", bg: "hsl(338 100% 65% / .12)" },
  listening_tf:        { label: "Listening", color: "hsl(338 100% 65%)", bg: "hsl(338 100% 65% / .12)" },
  listening_image_grid:{ label: "Listening", color: "hsl(338 100% 65%)", bg: "hsl(338 100% 65% / .12)" },
  listening_sequence:  { label: "Listening", color: "hsl(338 100% 65%)", bg: "hsl(338 100% 65% / .12)" },
  listening_match:     { label: "Listening", color: "hsl(338 100% 65%)", bg: "hsl(338 100% 65% / .12)" },
  listening_classify:  { label: "Listening", color: "hsl(338 100% 65%)", bg: "hsl(338 100% 65% / .12)" },
  speaking_prompt:     { label: "Speaking",  color: "hsl(150 62% 41%)",  bg: "hsl(150 62% 41% / .12)"  },
  image_describe:      { label: "Speaking",  color: "hsl(150 62% 41%)",  bg: "hsl(150 62% 41% / .12)"  },
  sequence_order:      { label: "Reading",   color: "hsl(14 86% 57%)",   bg: "hsl(14 86% 57% / .12)"   },
  match_columns:       { label: "Reading",   color: "hsl(14 86% 57%)",   bg: "hsl(14 86% 57% / .12)"   },
};

export function SessionRenderer({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showResult = false,
}: Props) {
  const meta = DOMAIN_META[question.type] ?? {
    label: "Practice",
    color: "hsl(338 100% 65%)",
    bg: "hsl(338 100% 65% / .12)",
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ color: meta.color, background: meta.bg }}
        >
          {meta.label}
        </span>
        {questionNumber !== undefined && totalQuestions !== undefined && (
          <span className="text-xs font-semibold text-muted-foreground">
            {questionNumber} / {totalQuestions}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${question.type}-${questionNumber}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {question.type === "multiple_choice" && (
            <MultipleChoice question={question} onSubmit={onAnswer} showResult={showResult} />
          )}
          {question.type === "image_hotspot" && (
            <ImageHotspot question={question} onSubmit={onAnswer} showResult={showResult} />
          )}
          {question.type === "fill_in_blank" && (
            <FillInBlank question={question} onSubmit={onAnswer} showResult={showResult} />
          )}
          {question.type === "short_answer" && (
            <ShortAnswer question={question} onSubmit={onAnswer} showResult={showResult} />
          )}
          {question.type === "word_bank" && (
            <WordBank question={question} onSubmit={onAnswer} showResult={showResult} />
          )}
          {question.type === "sentence_frame" && (
            <SentenceFrame question={question} onSubmit={(a) => onAnswer(a as unknown as QuestionAnswer)} />
          )}
          {question.type === "listening_mc" && (
            <ListeningMC question={question} onSubmit={onAnswer} showResult={showResult} />
          )}
          {question.type === "listening_tf" && (
            <ListeningTrueFalse question={question} onSubmit={(a) => onAnswer(a)} showResult={showResult} />
          )}
          {question.type === "listening_image_grid" && (
            <ListeningImageGrid question={question} onSubmit={onAnswer} showResult={showResult} />
          )}
          {question.type === "listening_sequence" && (
            <ListeningSequence question={question} onSubmit={onAnswer} showResult={showResult} />
          )}
          {question.type === "listening_match" && (
            <ListeningMatch question={question} onSubmit={onAnswer} showResult={showResult} />
          )}
          {question.type === "listening_classify" && (
            <ListeningClassify question={question} onSubmit={onAnswer} showResult={showResult} />
          )}
          {question.type === "speaking_prompt" && (
            <SpeakingPrompt question={question} onSubmit={(a) => onAnswer(a as unknown as QuestionAnswer)} />
          )}
          {question.type === "image_describe" && (
            <ImageDescribe question={question} onSubmit={(a) => onAnswer(a as unknown as QuestionAnswer)} />
          )}
          {question.type === "sequence_order" && (
            <SequenceOrder question={question} onSubmit={onAnswer} showResult={showResult} />
          )}
          {question.type === "match_columns" && (
            <MatchColumns question={question} onSubmit={onAnswer} showResult={showResult} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
