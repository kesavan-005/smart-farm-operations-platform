import { useState, useRef, useEffect } from 'react';
import { Sparkles, MapPin, Leaf, AlertCircle, X } from 'lucide-react';
import { useFarmStore } from '@/store/farmStore';
import { useFarm } from '@/features/farms/api/farmsApi';
import { useFields } from '@/features/fields/api/fieldsApi';
import { useGenerateAdvisory } from '../api/advisoryApi';
import { ChatMessage, type ChatMessageData } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { usePermissionStore } from '@/store/permissionStore';

export function AdvisoryWidget() {
  const { activeFarmId } = useFarmStore();
  const { canAccess } = usePermissionStore();
  
  // Widget open/close state
  const [isOpen, setIsOpen] = useState(false);

  // Farm and Field queries
  const { data: farm } = useFarm(activeFarmId || '');
  const { data: fields = [] } = useFields(activeFarmId || '');
  const generateAdvisory = useGenerateAdvisory(activeFarmId);
  const { t } = useTranslation('advisory');

  // Local state
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Only render widget if user has permission
  const hasAccess = canAccess('AI_ADVISORY');

  // Clear state when activeFarmId changes
  useEffect(() => {
    setMessages([]);
    setSelectedFieldId('');
    setError(null);
  }, [activeFarmId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    const content = input.trim();
    if (!activeFarmId || !content) return;

    setError(null);
    setInput('');
    const userMsgId = crypto.randomUUID();
    const newUserMsg: ChatMessageData = {
      id: userMsgId,
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, newUserMsg]);

    try {
      const response = await generateAdvisory.mutateAsync({
        question: content,
        fieldId: selectedFieldId || undefined,
      });

      const assistantMsgId = crypto.randomUUID();
      const newAssistantMsg: ChatMessageData = {
        id: assistantMsgId,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        weatherUsed: response.weatherUsed,
      };

      setMessages((prev) => [...prev, newAssistantMsg]);
    } catch (err: any) {
      const code = err?.code || '';
      let errorMessage = t('errors.default', 'Unable to generate an advisory right now. Please try again.');
      
      if (code === 'VALIDATION_ERROR' || err?.response?.status === 400) {
        errorMessage = t('errors.validation', 'Please check your question and try again.');
      } else if (code === 'UNAUTHORIZED' || err?.response?.status === 401) {
        errorMessage = t('errors.unauthorized', 'Your session has expired. Please sign in again.');
      } else if (code === 'FORBIDDEN' || err?.response?.status === 403) {
        errorMessage = t('errors.forbidden', 'You do not have access to this farm.');
      } else if (code === 'NOT_FOUND' || err?.response?.status === 404) {
        errorMessage = t('errors.notFound', 'Farm or field information could not be found.');
      } else if (code === 'SERVICE_UNAVAILABLE' || err?.response?.status === 503) {
        errorMessage = t('errors.unavailable', 'AI Advisory is temporarily unavailable. Please try again later.');
      }
      
      setError(errorMessage);
    }
  };

  if (!hasAccess || !activeFarmId) {
    return null; // Do not show widget if no access or no active farm
  }

  const farmName = farm?.name || 'Farm';

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_0_rgba(5,150,105,0.39)] hover:bg-emerald-700 hover:scale-105 transition-all z-[var(--z-fixed)]"
          aria-label={t('openAdvisory', 'Open AI Advisory')}
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 w-full h-[100dvh] md:w-[450px] md:h-[650px] md:max-h-[calc(100dvh-40px)] md:bottom-4 md:right-4 bg-background md:rounded-2xl shadow-2xl flex flex-col z-[var(--z-modal)] border border-border overflow-hidden sf-slide-up">
          {/* Header */}
          <div className="shrink-0 p-4 border-b border-border flex flex-col gap-3 bg-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                {t('title', 'AI Advisory')}
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Selector */}
            <div className="flex flex-col gap-1.5 sf-card p-2.5 bg-muted/30">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {t('advisingFor', 'Advising for: ')} <span className="text-foreground">{farmName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={selectedFieldId}
                  onChange={(e) => setSelectedFieldId(e.target.value)}
                  disabled={generateAdvisory.isPending}
                  aria-label={t('selectField', 'Select Field')}
                  className="text-xs bg-card border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                >
                  <option value="">{t('entireFarm', 'Entire farm')}</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.fieldCode ? `(${f.fieldCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 hide-scrollbar relative bg-muted/10">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-base text-foreground mb-1">{t('emptyTitle', 'Ask AI Advisory')}</h3>
                <p className="text-xs text-muted-foreground max-w-[250px] mx-auto mb-6">
                  {t('emptySubtitle', 'Ask a question about your crops, soil, irrigation, pests, or weather response.')}
                </p>
                
                <div className="flex flex-col gap-2 w-full">
                  <Button variant="outline" size="sm" className="justify-start text-left h-auto py-2 whitespace-normal text-xs" onClick={() => setInput(t('example1', 'Why are my leaves turning yellow?'))}>
                    {t('example1', 'Why are my leaves turning yellow?')}
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start text-left h-auto py-2 whitespace-normal text-xs" onClick={() => setInput(t('example2', 'How often should I irrigate this crop?'))}>
                    {t('example2', 'How often should I irrigate this crop?')}
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start text-left h-auto py-2 whitespace-normal text-xs" onClick={() => setInput(t('example3', 'What should I check for pest damage?'))}>
                    {t('example3', 'What should I check for pest damage?')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pb-2" role="list">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                
                {generateAdvisory.isPending && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-center gap-3 sf-card p-3 px-4 rounded-2xl bg-card rounded-tl-sm text-sm text-muted-foreground">
                      <Sparkles className="w-4 h-4 animate-pulse text-emerald-600" />
                      <span aria-live="polite">{t('thinking', 'AI Advisory is thinking...')}</span>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg mb-4">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="shrink-0 p-3 bg-card border-t border-border">
            <ChatInput 
              value={input}
              onChange={setInput}
              onSend={handleSend} 
              isPending={generateAdvisory.isPending} 
              disabled={!activeFarmId}
            />
          </div>
        </div>
      )}
    </>
  );
}
