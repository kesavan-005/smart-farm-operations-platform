// FocusLayout — full-screen, nav hidden, for single-task flows
// Used by: Add Activity, Farm Setup Wizard, Add Expense, etc.

import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, X } from 'lucide-react';

interface FocusLayoutProps {
  children: ReactNode;
  /** Page title displayed in the top bar */
  title: string;
  /** Whether to show back arrow (default) or close X */
  closeMode?: 'back' | 'close';
  /** Custom back/close handler — defaults to navigate(-1) */
  onClose?: () => void;
  /** Optional step indicator (e.g., "Step 2 of 4") */
  stepIndicator?: string;
}

export function FocusLayout({
  children,
  title,
  closeMode = 'back',
  onClose,
  stepIndicator,
}: FocusLayoutProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-[var(--z-sticky)] bg-[rgb(var(--color-surface-elevated))] border-b border-[rgb(var(--color-border))] px-4 h-14 flex items-center gap-3 shadow-[var(--shadow-sm)]">
        <button
          onClick={handleClose}
          className="min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] flex items-center justify-center rounded-lg text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface))] transition-colors"
          aria-label={closeMode === 'back' ? t('back') : t('close')}
          type="button"
        >
          {closeMode === 'back' ? (
            <ArrowLeft size={22} />
          ) : (
            <X size={22} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-[rgb(var(--color-text-primary))] truncate">
            {title}
          </h1>
          {stepIndicator && (
            <p className="text-xs text-[rgb(var(--color-text-secondary))]">
              {stepIndicator}
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
