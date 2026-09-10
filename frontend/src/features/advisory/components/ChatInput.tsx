import { useRef, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isPending: boolean;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, isPending, disabled }: ChatInputProps) {
  const { t } = useTranslation('advisory');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !isPending && !disabled) {
      onSend();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end sf-card p-2 sm:p-3 rounded-2xl shadow-sm border border-border bg-card focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background transition-all">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('inputPlaceholder', 'Ask a question about your farm...')}
        disabled={disabled || isPending}
        rows={1}
        aria-label="Chat input"
        className="flex-1 max-h-[150px] min-h-[40px] resize-none bg-transparent p-2 text-sm focus:outline-none disabled:opacity-50"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || isPending || !value.trim()}
        size="icon"
        aria-label="Send message"
        className="shrink-0 rounded-xl h-10 w-10 transition-transform active:scale-95"
      >
        <SendHorizontal className="w-5 h-5" />
      </Button>
    </div>
  );
}
