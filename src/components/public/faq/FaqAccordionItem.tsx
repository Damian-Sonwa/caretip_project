import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqAccordionItemProps = {
  question: string;
  questionContent?: ReactNode;
  answer: string;
  answerContent?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
};

export function FaqAccordionItem({
  question,
  questionContent,
  answer,
  answerContent,
  isOpen,
  onToggle,
}: FaqAccordionItemProps) {
  return (
    <div
      className={cn(
        "caretip-faq-item-wise",
        isOpen && "caretip-faq-item-wise--open",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="caretip-faq-item-wise__trigger"
        aria-expanded={isOpen}
      >
        <span className="caretip-faq-item-wise__question">
          {questionContent ?? question}
        </span>
        <span className="caretip-faq-item-wise__icon" aria-hidden>
          {isOpen ? <Minus className="size-5" /> : <Plus className="size-5" />}
        </span>
      </button>
      {isOpen ? (
        <div className="caretip-faq-item-wise__answer-wrap">
          {answerContent ?? (
            <p className="caretip-faq-item-wise__answer whitespace-pre-line">{answer}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
