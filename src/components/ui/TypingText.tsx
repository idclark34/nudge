import { useEffect, useState } from "react";

interface TypingTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export const TypingText = ({
  text,
  speed = 40,
  delay = 0,
  className = "",
  onComplete,
}: TypingTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(false);
    setHasStarted(false);

    const startTimeout = setTimeout(() => {
      setHasStarted(true);
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, delay]);

  useEffect(() => {
    if (!hasStarted) return;

    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
      onComplete?.();
    }
  }, [displayedText, text, speed, hasStarted, onComplete]);

  if (!hasStarted) {
    return <span className={className}>&nbsp;</span>;
  }

  return (
    <span className={className}>
      {displayedText}
      {isTyping && <span className="typing-cursor" />}
    </span>
  );
};

