import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PromptResult } from "@/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

// Mood data with new expressive labels
const moodOptions = [
  { value: 0, label: "Completely drained", emoji: "🥀", category: "low" },
  { value: 1, label: "Barely holding on", emoji: "🥀", category: "low" },
  { value: 2, label: "Running on empty", emoji: "🥀", category: "low" },
  { value: 3, label: "Low + foggy", emoji: "🌫️", category: "foggy" },
  { value: 4, label: "Cloudy skies", emoji: "🌫️", category: "foggy" },
  { value: 5, label: "Balanced", emoji: "🌤️", category: "balanced" },
  { value: 6, label: "Coasting along", emoji: "🌤️", category: "balanced" },
  { value: 7, label: "Motivated + alive", emoji: "🔥", category: "motivated" },
  { value: 8, label: "On fire", emoji: "🔥", category: "motivated" },
  { value: 9, label: "Electric", emoji: "🌈", category: "electric" },
  { value: 10, label: "Unstoppable", emoji: "🌈", category: "electric" },
];

const defaultMood = 5;

// Get gradient based on mood
const getMoodGradient = (mood: number): string => {
  if (mood <= 2) return "from-slate-600 via-slate-500 to-indigo-900";
  if (mood <= 4) return "from-slate-400 via-blue-400 to-indigo-500";
  if (mood <= 6) return "from-sky-300 via-teal-300 to-emerald-400";
  if (mood <= 8) return "from-amber-400 via-orange-400 to-rose-500";
  return "from-rose-400 via-fuchsia-500 to-violet-500";
};

// Get slider track color based on mood
const getSliderTrackStyle = (mood: number): string => {
  if (mood <= 2) return "linear-gradient(90deg, #475569, #312e81)";
  if (mood <= 4) return "linear-gradient(90deg, #94a3b8, #6366f1)";
  if (mood <= 6) return "linear-gradient(90deg, #7dd3fc, #34d399)";
  if (mood <= 8) return "linear-gradient(90deg, #fbbf24, #f43f5e)";
  return "linear-gradient(90deg, #fb7185, #a855f7)";
};

// Get text color based on mood (for contrast)
const getMoodTextColor = (mood: number): string => {
  if (mood <= 2) return "text-white";
  if (mood <= 4) return "text-white";
  return "text-slate-800";
};

const formatPromptText = (template: string, projectTag?: string | null) =>
  projectTag && template.includes("[PROJECT]")
    ? template.replace(/\[PROJECT\]/g, projectTag)
    : template;

// Sparkle component for high moods
const Sparkles = ({ count = 8 }: { count?: number }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="sparkle absolute"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
        }}
      >
        ✨
      </div>
    ))}
  </div>
);

// Droop animation for low moods
const DroopingFlower = () => (
  <div className="drooping-flower text-4xl">🥀</div>
);

export const PromptCapturePage = () => {
  const navigate = useNavigate();

  const [promptResult, setPromptResult] = useState<PromptResult | null>(null);
  const [step, setStep] = useState(0);
  const [moodScore, setMoodScore] = useState<number>(defaultMood);
  const [note, setNote] = useState("");
  const [projectTag, setProjectTag] = useState<string | null>(null);
  const [traitTag, setTraitTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [sliderInteracted, setSliderInteracted] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [isNoteFocused, setIsNoteFocused] = useState(false);

  const prompt = promptResult?.prompt ?? null;

  // Cycling placeholders for note input
  const notePlaceholders = [
    "Something that made you smile?",
    "A moment you survived.",
    "A thought worth keeping.",
    "A tiny win?",
    "What caught your attention today?",
    "A feeling you want to remember.",
  ];

  // Typewriter effect for placeholders
  useEffect(() => {
    if (step !== 1 || note.length > 0 || isNoteFocused) return;
    
    const currentPlaceholder = notePlaceholders[placeholderIndex];
    let charIndex = 0;
    setTypedPlaceholder("");
    
    // Type out the current placeholder
    const typeInterval = setInterval(() => {
      if (charIndex <= currentPlaceholder.length) {
        setTypedPlaceholder(currentPlaceholder.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 60); // 60ms per character
    
    // Move to next placeholder after typing + pause
    const nextTimeout = setTimeout(() => {
      setPlaceholderIndex((prev) => (prev + 1) % notePlaceholders.length);
    }, currentPlaceholder.length * 60 + 2500); // typing time + 2.5s pause
    
    return () => {
      clearInterval(typeInterval);
      clearTimeout(nextTimeout);
    };
  }, [step, note.length, isNoteFocused, placeholderIndex]);

  // Make body transparent for this window
  useEffect(() => {
    document.documentElement.classList.add("prompt-window");
    document.body.classList.add("prompt-window");
    return () => {
      document.documentElement.classList.remove("prompt-window");
      document.body.classList.remove("prompt-window");
    };
  }, []);

  useEffect(() => {
    const loadPrompt = async () => {
      try {
        setLoading(true);
        const result = await api.getPrompt();
        if (result) {
          setPromptResult(result);
          setProjectTag(result.projectTagSuggestion ?? null);
        } else {
          setPromptResult(null);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not fetch prompt.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadPrompt();
  }, []);

  const resolvedPromptText = useMemo(() => {
    if (!prompt) {
      return "How's your vibe right now?";
    }
    return formatPromptText(prompt.text, projectTag ?? promptResult?.projectTagSuggestion);
  }, [prompt, projectTag, promptResult?.projectTagSuggestion]);

  const handleClose = () => {
    window.close();
    navigate("/");
  };

  const handleSave = useCallback(async () => {
    const score = moodScore ?? defaultMood;
    const selectedMood = moodOptions.find((option) => option.value === score);

    try {
      setLoading(true);
      setError(null);

      const lines = [
        `Mood check-in: ${score}/10 — ${
          selectedMood
            ? `${selectedMood.emoji} ${selectedMood.label}`
            : "Feeling it out"
        }`,
      ];

      if (note.trim()) {
        lines.push(`Note: ${note.trim()}`);
      }

      await api.createEntry({
        promptId: prompt?.id ?? null,
        promptText: resolvedPromptText,
        category: prompt?.category ?? "emotion",
        text: lines.join("\n"),
        projectTag: projectTag || null,
        traitTag: traitTag || null,
      });

      if (prompt?.id) {
        await api.markPromptHandled(prompt.id, "saved");
      }

      // Show calm exit animation before closing
      setShowContent(false);
      setShowCelebration(true);
      setTimeout(() => {
        handleClose();
      }, 1500); // 1.5 second gentle exit
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save entry right now.",
      );
      setLoading(false);
    }
  }, [
    moodScore,
    note,
    prompt?.category,
    prompt?.id,
    projectTag,
    resolvedPromptText,
    traitTag,
  ]);

  const handleSkip = async () => {
    if (prompt?.id) {
      await api.markPromptHandled(prompt.id, "skipped");
    }
    handleClose();
  };

  const handleSnooze = async () => {
    await api.snoozePrompt(15);
    handleClose();
  };

  const totalSteps = 3;
  const isLastStep = step === totalSteps - 1;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setShowContent(false);
      setAnimationKey((prev) => prev + 1);
      setTimeout(() => {
        setStep((prev) => prev + 1);
        setShowContent(true);
      }, 100);
      return;
    }
    void handleSave();
  };

  const handleBack = () => {
    if (step > 0) {
      setShowContent(false);
      setAnimationKey((prev) => prev + 1);
      setTimeout(() => {
        setStep((prev) => prev - 1);
        setShowContent(true);
      }, 100);
    }
  };

  // Trigger content reveal after initial mount
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const vibeThemes = [
    { value: "light", label: "A moment of light", emoji: "✨" },
    { value: "pushed", label: "Pushed through something hard", emoji: "🔥" },
    { value: "people", label: "Someone made it better", emoji: "💛" },
    { value: "steady", label: "Slow but steady", emoji: "🌿" },
    { value: "energy", label: "Found energy", emoji: "⚡" },
    { value: "weird", label: "Weird or interesting", emoji: "🌀" },
    { value: "step", label: "Took a step forward", emoji: "🎯" },
    { value: "mind", label: "Lots on the mind", emoji: "💭" },
  ];

  const currentMood = moodOptions.find((o) => o.value === moodScore);
  const moodGradient = getMoodGradient(moodScore);
  const textColor = getMoodTextColor(moodScore);
  const isLowMood = moodScore <= 2;
  const isHighMood = moodScore >= 9;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMoodScore(Number(e.target.value));
    if (!sliderInteracted) setSliderInteracted(true);
  };

  // Celebration screen - calm, gentle exit
  if (showCelebration) {
    return (
      <div className="drag-region flex h-full flex-col items-center justify-center p-8" style={{ background: 'transparent' }}>
        <div className="exit-animation relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 shadow-2xl">
          {/* Soft floating particles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="floating-leaf absolute text-2xl"
                style={{
                  left: `${15 + i * 15}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                🌿
              </div>
            ))}
          </div>

          {/* Exit message */}
          <div className="z-10 flex flex-col items-center gap-3 text-center">
            <span className="exit-emoji text-5xl">🌿</span>
            <p className="exit-text-1 text-2xl font-semibold text-white drop-shadow-md">
              Mood logged.
            </p>
            <p className="exit-text-2 text-lg font-medium text-white/80">
              See you soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="drag-region flex h-full flex-col items-center justify-center p-8" style={{ background: 'transparent' }}>
      <div className={cn(
        "prompt-entrance relative flex h-full w-full flex-col overflow-hidden rounded-3xl shadow-2xl transition-all duration-700",
        `bg-gradient-to-br ${moodGradient}`
      )}>
        {/* Mood-reactive background effects */}
        {isHighMood && <Sparkles count={12} />}
        
        {/* Glass overlay for content */}
        <div className="relative z-10 flex h-full flex-col p-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="drag-region flex items-center gap-3">
              <span className={cn("text-2xl", sliderInteracted ? "animate-pop" : "animate-bounce-in")}>
                {currentMood?.emoji || "🎯"}
              </span>
              <div>
                <p className={cn("text-xs font-bold uppercase tracking-widest opacity-80", textColor)}>
                  Mood Check-in
                </p>
                <p className={cn("text-[10px] font-medium opacity-60", textColor)}>
                  Step {step + 1} of {totalSteps}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={cn(
                "no-drag rounded-full px-4 py-2 text-xs font-semibold backdrop-blur-sm transition-all",
                "bg-white/20 hover:bg-white/30 hover:scale-105 active:scale-95",
                textColor
              )}
            >
              Close
            </button>
          </div>

          {/* Main content area */}
          <div className="flex flex-1 flex-col justify-center gap-6 py-6">
            {showContent && (
              <>
                {/* Step 1: Mood Slider */}
                {step === 0 && (
                  <div key={animationKey} className="no-drag space-y-6 animate-fade-up">
                    <div className="text-center">
                      <h2 className={cn("text-2xl font-bold tracking-tight", textColor)}>
                        How's your vibe today?
                      </h2>
                      <p className={cn("mt-1 text-sm opacity-70", textColor)}>
                        Slide to capture the feeling
                      </p>
                    </div>

                    {/* Animated emoji display */}
                    <div className="flex justify-center">
                      <div className={cn(
                        "relative flex h-24 w-24 items-center justify-center rounded-full",
                        "bg-white/20 backdrop-blur-md shadow-inner",
                        isLowMood && "animate-droop",
                        isHighMood && "animate-float"
                      )}>
                        <span className={cn(
                          "text-5xl transition-transform duration-300",
                          sliderInteracted && "animate-pop"
                        )} key={moodScore}>
                          {currentMood?.emoji}
                        </span>
                        {isHighMood && (
                          <div className="absolute inset-0 animate-pulse-ring rounded-full border-4 border-white/30" />
                        )}
                      </div>
                    </div>

                    {/* Mood label */}
                    <p className={cn(
                      "text-center text-lg font-semibold transition-all duration-300",
                      textColor,
                      sliderInteracted && "animate-fade-up"
                    )} key={`label-${moodScore}`}>
                      {currentMood?.label}
                    </p>

                    {/* Custom slider */}
                    <div className="space-y-3 px-2">
                      <div className="relative">
                        <div 
                          className="absolute inset-0 h-3 rounded-full opacity-30"
                          style={{ background: getSliderTrackStyle(moodScore) }}
                        />
                        <input
                          type="range"
                          min={0}
                          max={10}
                          value={moodScore}
                          onChange={handleSliderChange}
                          className="mood-slider no-drag relative z-10 h-3 w-full cursor-pointer appearance-none rounded-full bg-transparent"
                          style={{
                            background: `linear-gradient(90deg, ${getSliderTrackStyle(moodScore).replace('linear-gradient(90deg, ', '').replace(')', '')} ${moodScore * 10}%, rgba(255,255,255,0.2) ${moodScore * 10}%)`
                          }}
                        />
                      </div>
                      <div className={cn("flex justify-between text-xs font-medium opacity-60", textColor)}>
                        <span>0</span>
                        <span className="font-bold text-base opacity-100">{moodScore}</span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Note */}
                {step === 1 && (
                  <div key={animationKey} className="no-drag space-y-5 animate-fade-up">
                    {/* Header with emoji */}
                    <div className="text-center space-y-2">
                      <span className="text-3xl animate-bounce-in">✍️</span>
                      <h2 className={cn("text-2xl font-bold tracking-tight", textColor)}>
                        Leave a tiny imprint on today.
                      </h2>
                      <p className={cn("text-sm opacity-80", textColor)}>
                        A sentence, a spark, or a small snapshot.
                      </p>
                    </div>

                    {/* Reactive textarea with glow */}
                    <div className="relative">
                      <textarea
                        rows={4}
                        className={cn(
                          "no-drag w-full rounded-2xl border-2 px-4 py-3 text-sm backdrop-blur-sm transition-all duration-300",
                          "focus:outline-none focus:ring-0",
                          isNoteFocused || note.length > 0
                            ? "border-white/50 bg-white/30 shadow-lg"
                            : "border-white/20 bg-white/15",
                          note.length > 0 && "note-glow"
                        )}
                        style={{ 
                          color: moodScore <= 4 ? 'white' : '#1e293b',
                        }}
                        placeholder={typedPlaceholder || notePlaceholders[placeholderIndex]}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onFocus={() => setIsNoteFocused(true)}
                        onBlur={() => setIsNoteFocused(false)}
                      />
                      {/* Typing indicator */}
                      {note.length > 0 && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1">
                          <span className="text-xs opacity-60">{note.length}</span>
                          <span className="animate-pulse text-lg">✨</span>
                        </div>
                      )}
                    </div>

                    {/* Dynamic footer message */}
                    <p className={cn(
                      "text-center text-xs italic transition-all duration-500",
                      textColor,
                      note.length > 0 ? "opacity-0" : "opacity-60"
                    )}>
                      Sometimes silence says enough.
                    </p>
                  </div>
                )}

                {/* Step 3: Vibe themes - Pill style */}
                {step === 2 && (
                  <div key={animationKey} className="no-drag space-y-5 animate-fade-up">
                    <div className="text-center space-y-2">
                      <span className="text-3xl animate-bounce-in">🎯</span>
                      <h2 className={cn("text-2xl font-bold tracking-tight", textColor)}>
                        What nudged your vibe?
                      </h2>
                      <p className={cn("text-sm opacity-70", textColor)}>
                        Pick one that resonates
                      </p>
                    </div>

                    {/* Pill-style tags */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {vibeThemes.map((theme, i) => {
                        const isSelected = projectTag === theme.value;
                        return (
                          <button
                            key={theme.value}
                            type="button"
                            onClick={() =>
                              setProjectTag((current) =>
                                current === theme.value ? null : theme.value,
                              )
                            }
                            className={cn(
                              "nudge-pill no-drag flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium",
                              "transition-all duration-300",
                              isSelected
                                ? "nudge-pill-selected bg-white/40 shadow-xl -translate-y-1"
                                : "bg-white/15 hover:bg-white/25",
                              textColor
                            )}
                            style={{ 
                              animationDelay: `${i * 0.05}s`,
                              transitionTimingFunction: 'cubic-bezier(0.25, 0.8, 0.25, 1)'
                            }}
                          >
                            <span className={cn(
                              "text-lg transition-transform duration-300",
                              isSelected && "scale-110"
                            )}>
                              {theme.emoji}
                            </span>
                            <span>{theme.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected indicator */}
                    {projectTag && (
                      <p className={cn(
                        "text-center text-xs opacity-70 animate-fade-up",
                        textColor
                      )}>
                        {vibeThemes.find(t => t.value === projectTag)?.emoji} Selected
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <p className="rounded-xl border border-red-300 bg-red-100 px-3 py-2 text-xs text-red-700">
                    {error}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer actions */}
          {showContent && (
            <div className="flex items-center justify-between animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <div className="flex gap-2">
                <button
                  onClick={handleSkip}
                  className={cn(
                    "no-drag rounded-full px-4 py-2 text-xs font-medium transition-all",
                    "bg-white/10 hover:bg-white/20 active:scale-95",
                    textColor, "opacity-70 hover:opacity-100"
                  )}
                >
                  Skip
                </button>
                <button
                  onClick={handleSnooze}
                  className={cn(
                    "no-drag rounded-full px-4 py-2 text-xs font-medium transition-all",
                    "bg-white/10 hover:bg-white/20 active:scale-95",
                    textColor, "opacity-70 hover:opacity-100"
                  )}
                >
                  Snooze
                </button>
              </div>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={handleBack}
                    className={cn(
                      "no-drag rounded-full px-4 py-2 text-xs font-medium transition-all",
                      "bg-white/20 hover:bg-white/30 active:scale-95",
                      textColor
                    )}
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={isLastStep && loading}
                  className={cn(
                    "no-drag rounded-full px-6 py-2.5 text-sm font-bold transition-all",
                    "bg-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
                    "text-slate-800",
                    isLastStep && loading && "opacity-70"
                  )}
                >
                  {isLastStep ? (loading ? "Saving…" : "Log mood ✨") : "Next →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
