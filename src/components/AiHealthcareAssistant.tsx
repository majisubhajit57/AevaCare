import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareHeart,
  Send,
  Volume2,
  BookOpenCheck,
  HelpCircle,
} from 'lucide-react';
import { ChatMessage, MedicationItem, RoleProfile } from '../types/care';

interface AiHealthcareAssistantProps {
  activeRole: RoleProfile;
  medications: MedicationItem[];
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (question: string) => Promise<void>;
}

const QUICK_SENIOR_QUESTIONS = [
  'What happens if I switch from Lasix (furosemide 20mg) to Microzide (hydrochlorothiazide 25mg)?',
  'What light, liquid, and easily digestible foods are best for Heart, Stomach, and Lungs?',
  'Why do my morning blood pressure pills sometimes make me feel dizzy when I stand up?',
  'Can I drink grapefruit juice or morning coffee with Lipitor and Norvasc?',
  'How much money can we save each month using non-retail online pharmacies?',
];

export const AiHealthcareAssistant: React.FC<AiHealthcareAssistantProps> = ({
  activeRole,
  medications,
  messages,
  isLoading,
  onSendMessage,
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTo({
        top: threadRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputQuestion.trim();
    if (!trimmed || isLoading) return;
    setInputQuestion('');
    await onSendMessage(trimmed);
  };

  const handleSpeakMessage = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore speech synthesis errors on unsupported browsers
      }
    }
  };

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="ai-assistant-heading"
        className="bg-white rounded-2xl border border-[#0F2537]/15 p-6 lg:p-8"
      >
        <div className="max-w-3xl mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0D7A6F] mb-1">
            Google AI Studio Powered · Drugs.com Clinical Reference Grounding
          </p>
          <h1
            id="ai-assistant-heading"
            className="text-3xl lg:text-4xl font-display font-extrabold text-[#0F2537]"
          >
            In-App AI Medication &amp; Care Assistant
          </h1>
          <p className="mt-2 text-lg text-[#0F2537]/80">
            Ask plain-English questions about your daily pills, chemical compositions (like Furosemide vs. Hydrochlorothiazide), light &amp; liquid disease diets (Heart, Stomach, Lungs), side effects, or lower-cost non-retail alternatives.
          </p>
        </div>

        {/* One-Tap Senior Question Starters */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0F2537] mb-3">
            <HelpCircle className="w-4 h-4 text-[#0D7A6F]" />
            <span>Tap Any Question Below to Ask Immediately:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {QUICK_SENIOR_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => void onSendMessage(q)}
                className="p-4 rounded-xl bg-[#FAF7F0] hover:bg-[#F5B73B]/25 border border-[#0F2537]/20 text-left text-base font-semibold text-[#0F2537] transition-colors cursor-pointer"
              >
                “{q}”
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Thread */}
        <div
          ref={threadRef}
          aria-live="polite"
          className="rounded-2xl bg-[#FAF7F0] border border-[#0F2537]/15 p-5 lg:p-6 space-y-5 max-h-[540px] overflow-y-auto"
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isUser ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-3xl rounded-2xl p-5 ${
                    isUser
                      ? 'bg-[#0F2537] text-white'
                      : 'bg-white border-2 border-[#0F2537]/15 text-[#0F2537]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2 text-xs font-mono">
                    <span
                      className={
                        isUser
                          ? 'text-[#F5B73B] font-bold'
                          : 'text-[#0D7A6F] font-bold'
                      }
                    >
                      {isUser
                        ? `${activeRole.name} (${activeRole.relationship})`
                        : 'AevaCare AI Healthcare Assistant'}
                    </span>
                    <span
                      className={
                        isUser ? 'text-white/75' : 'text-[#0F2537]/60'
                      }
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  <div className="text-lg leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </div>

                  {!isUser && (
                    <div className="mt-4 pt-3 border-t border-[#0F2537]/10 flex flex-wrap items-center justify-between gap-3 text-xs text-[#0F2537]/75">
                      <div className="flex items-center gap-1.5 font-semibold text-[#0D7A6F]">
                        <BookOpenCheck className="w-4 h-4 shrink-0" />
                        <span>
                          Source: {msg.sourceCitation || 'Drugs.com Clinical Reference & Google AI Studio'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(msg.text)}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF7F0] hover:bg-[#F5B73B]/30 border border-[#0F2537]/20 font-display font-bold text-[#0F2537] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4 text-[#0D7A6F]" />
                        <span>Read Answer Aloud</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="p-4 rounded-xl bg-white border border-[#0F2537]/15 text-base font-semibold text-[#0F2537] flex items-center gap-3">
              <MessageSquareHeart className="w-5 h-5 text-[#0D7A6F]" />
              <span>
                Checking medication composition and Drugs.com reference...
              </span>
            </div>
          )}
        </div>

        {/* Question Input Form */}
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-3">
          <label htmlFor="ai-question-input" className="sr-only">
            Ask a medical or medication question
          </label>
          <input
            id="ai-question-input"
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder={`Ask about ${medications.map((m) => m.brandName).join(', ')}, side effects, or prices...`}
            className="flex-1 px-5 py-4 rounded-xl bg-[#FAF7F0] border-2 border-[#0F2537]/25 text-lg text-[#0F2537] placeholder:text-[#0F2537]/50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            className="px-6 py-4 rounded-xl bg-[#0F2537] hover:bg-[#183650] disabled:opacity-50 text-[#F5B73B] font-display font-extrabold text-lg flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Send className="w-5 h-5" />
            <span>Ask AI Assistant</span>
          </button>
        </form>
      </section>
    </div>
  );
};
