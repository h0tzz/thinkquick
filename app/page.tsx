"use client";

import {
  Brain,
  Check,
  AtSign,
  Mic2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings,
  Shuffle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Mode = "off" | "research";
type Phase = "ready" | "researching" | "speaking" | "finished";

type Topic = {
  id: string;
  title: string;
};

const TOPICS: Record<Mode, Topic[]> = {
  off: [
    { id: "paper-maps", title: "Why paper maps still feel useful" },
    { id: "perfect-morning", title: "The perfect morning without a phone" },
    { id: "small-cafes", title: "Why tiny cafes beat chains" },
    { id: "weekend", title: "The best format for a weekend" },
    { id: "public-transport", title: "What makes public transport pleasant" },
    { id: "gift", title: "A gift that does not need to be expensive" },
    { id: "lists", title: "Why lists are calming" },
    { id: "new-city", title: "How to feel at home in a new city" },
    { id: "quiet-place", title: "The best place in a city to think" },
    { id: "movie-night", title: "What makes a movie night memorable" },
    { id: "desk", title: "A workspace that helps you focus" },
    { id: "advice", title: "Advice that only made sense later" },
  ],
  research: [
    { id: "fermi", title: "The Fermi paradox" },
    { id: "ai-trust", title: "How AI changes trust in information" },
    { id: "aging", title: "Demographic aging and the labor market" },
    { id: "water", title: "Water as a future source of political conflict" },
    { id: "quantum", title: "Quantum computing and the future of encryption" },
    { id: "attention", title: "Why attention became an economic resource" },
    { id: "energy", title: "Why energy storage matters for green power" },
    { id: "cities", title: "Why big cities get expensive faster than salaries" },
    { id: "privacy", title: "Health data between usefulness and privacy" },
    { id: "deepfakes", title: "Deepfakes and the crisis of public evidence" },
    { id: "space", title: "The economy of low Earth orbit" },
    { id: "education", title: "Education after personal AI tutors" },
  ],
};

function clampMinutes(value: number) {
  return Math.max(1, Math.min(60, Number.isFinite(value) ? value : 1));
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function pickTopic(mode: Mode, avoidId?: string) {
  const pool = TOPICS[mode];
  let next = pool[Math.floor(Math.random() * pool.length)];

  if (avoidId && pool.length > 1) {
    while (next.id === avoidId) {
      next = pool[Math.floor(Math.random() * pool.length)];
    }
  }

  return next;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("research");
  const [topic, setTopic] = useState<Topic>(TOPICS.research[0]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [isRunning, setIsRunning] = useState(false);
  const [researchMinutes, setResearchMinutes] = useState(10);
  const [speechMinutes, setSpeechMinutes] = useState(5);
  const [remaining, setRemaining] = useState(10 * 60);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const activeTotal = useMemo(() => {
    if (phase === "researching") {
      return researchMinutes * 60;
    }

    if (phase === "speaking") {
      return speechMinutes * 60;
    }

    return mode === "research" ? researchMinutes * 60 : speechMinutes * 60;
  }, [mode, phase, researchMinutes, speechMinutes]);

  const progress = activeTotal > 0 ? 1 - remaining / activeTotal : 0;

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (remaining > 0 || !isRunning) {
      return;
    }

    setIsRunning(false);
    setPhase((currentPhase) =>
      currentPhase === "researching" ? "speaking" : "finished",
    );
    setRemaining((currentRemaining) => {
      if (phase === "researching") {
        return speechMinutes * 60;
      }

      return currentRemaining;
    });
  }, [isRunning, phase, remaining, speechMinutes]);

  function resetForMode(nextMode: Mode) {
    setMode(nextMode);
    setTopic(pickTopic(nextMode, topic.id));
    setPhase("ready");
    setIsRunning(false);
    setRemaining((nextMode === "research" ? researchMinutes : speechMinutes) * 60);
  }

  function spinAgain() {
    const nextTopic = pickTopic(mode, topic.id);
    setTopic(nextTopic);
    setPhase("ready");
    setIsRunning(false);
    setRemaining((mode === "research" ? researchMinutes : speechMinutes) * 60);
  }

  function startOrPause() {
    if (phase === "finished") {
      setPhase(mode === "research" ? "researching" : "speaking");
      setRemaining((mode === "research" ? researchMinutes : speechMinutes) * 60);
      setIsRunning(true);
      return;
    }

    if (phase === "ready") {
      setPhase(mode === "research" ? "researching" : "speaking");
      setRemaining((mode === "research" ? researchMinutes : speechMinutes) * 60);
      setIsRunning(true);
      return;
    }

    setIsRunning((value) => !value);
  }

  function resetTimer() {
    const nextPhase = mode === "research" ? "researching" : "speaking";
    setPhase(nextPhase);
    setIsRunning(false);
    setRemaining((nextPhase === "researching" ? researchMinutes : speechMinutes) * 60);
  }

  function updateResearchMinutes(value: number) {
    const next = clampMinutes(value);
    setResearchMinutes(next);

    if (mode === "research" && (phase === "ready" || phase === "researching")) {
      setIsRunning(false);
      setRemaining(next * 60);
    }
  }

  function updateSpeechMinutes(value: number) {
    const next = clampMinutes(value);
    setSpeechMinutes(next);

    if (mode === "off" || phase === "speaking") {
      setIsRunning(false);
      setRemaining(next * 60);
    }
  }

  const helperText =
    mode === "research"
      ? "Spin a topic, set a research timer, then start the speech timer whenever you're ready."
      : "Spin a topic, take a breath, then talk without preparation.";

  const topicLabel =
    phase === "researching"
      ? "research timer"
      : phase === "speaking"
        ? "speech timer"
        : "your topic";

  const primaryLabel = useMemo(() => {
    if (isRunning) {
      return `Pause ${formatTime(remaining)}`;
    }

    if (phase === "researching" || phase === "speaking") {
      return `Resume ${formatTime(remaining)}`;
    }

    if (phase === "finished") {
      return "Start again";
    }

    if (mode === "research") {
      return `Start ${researchMinutes} min research`;
    }

    return `Start ${speechMinutes} min speech`;
  }, [isRunning, mode, phase, remaining, researchMinutes, speechMinutes]);

  return (
    <main className="unprompted-page">
      <div className="ambient" aria-hidden="true" />

      <section className="hero-shell" aria-label="Random speaking topic">
        <header className="hero-header">
          <h1>thinkQuick</h1>
          <a className="maker-pill" href="https://chatgpt.com" aria-label="made for practice">
            <span>made for</span>
            <AtSign size={15} aria-hidden="true" />
            <strong>practice</strong>
          </a>
        </header>

        <div className="mode-toggle" role="group" aria-label="Mode">
          <button
            className={mode === "off" ? "active" : ""}
            type="button"
            onClick={() => resetForMode("off")}
          >
            <Brain size={17} aria-hidden="true" />
            Off the cuff
          </button>
          <button
            className={mode === "research" ? "active" : ""}
            type="button"
            onClick={() => resetForMode("research")}
          >
            <Search size={17} aria-hidden="true" />
            Deep research
          </button>
        </div>

        <p className="helper-copy">{helperText}</p>

        <div className="topic-area" aria-live="polite">
          <p className="topic-label">{topicLabel}</p>
          <h2>{topic.title}</h2>
          {(phase === "researching" || phase === "speaking" || phase === "finished") && (
            <div className="timer-line" aria-label="Timer">
              <span>{formatTime(remaining)}</span>
              <i style={{ transform: `scaleX(${Math.max(0, Math.min(1, progress))})` }} />
            </div>
          )}
        </div>

        <div className="action-row">
          <button className="spin-button" type="button" onClick={spinAgain}>
            <Shuffle size={18} aria-hidden="true" />
            Spin again
          </button>
          <button className="start-button" type="button" onClick={startOrPause}>
            {isRunning ? (
              <Pause size={18} aria-hidden="true" />
            ) : phase === "finished" ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <Play size={18} aria-hidden="true" />
            )}
            {primaryLabel}
          </button>
          <button
            className="settings-button"
            type="button"
            aria-label="Open timer settings"
            title="Timer settings"
            onClick={() => setSettingsOpen((value) => !value)}
          >
            <Settings size={19} aria-hidden="true" />
          </button>
        </div>

        {settingsOpen && (
          <div className="settings-popover">
            <label>
              <span>Research</span>
              <input
                min={1}
                max={60}
                type="number"
                value={researchMinutes}
                onChange={(event) =>
                  updateResearchMinutes(Number(event.currentTarget.value))
                }
              />
            </label>
            <label>
              <span>Speech</span>
              <input
                min={1}
                max={60}
                type="number"
                value={speechMinutes}
                onChange={(event) =>
                  updateSpeechMinutes(Number(event.currentTarget.value))
                }
              />
            </label>
            <button type="button" onClick={resetTimer}>
              <RotateCcw size={16} aria-hidden="true" />
              Reset timer
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
