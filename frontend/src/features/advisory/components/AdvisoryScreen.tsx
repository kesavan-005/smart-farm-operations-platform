import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, Leaf, AlertCircle } from 'lucide-react';
import { useFarmStore } from '@/store/farmStore';
import { useFarm } from '@/features/farms/api/farmsApi';
import { useFields } from '@/features/fields/api/fieldsApi';
import { useGenerateAdvisory } from '../api/advisoryApi';
import { ChatMessage, type ChatMessageData } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function AdvisoryScreen() {
  const navigate = useNavigate();
  const { activeFarmId } = useFarmStore();

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

  // Clear state when activeFarmId changes
  useEffect(() => {
    setMessages([]);
    setSelectedFieldId('');
    setError(null);
  }, [activeFarmId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  if (!activeFarmId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Sparkles className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t('missingFarmTitle', 'Please select a farm before using AI Advisory.')}</h2>
        <Button onClick={() => navigate('/farms')}>{t('goToFarms', 'Go to Farms')}</Button>
      </div>
    );
  }

  const farmName = farm?.name || 'Farm';

  return (
    <div className="flex flex-col h-[calc(100dvh-theme(spacing.16))] sm:h-[calc(100dvh-theme(spacing.20))] sf-slide-up">
      {/* Header */}
      <div className="shrink-0 pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            {t('title', 'AI Advisory')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle', 'Get expert agricultural advice based on your farm context and current weather.')}
          </p>
        </div>

        {/* Context Selector */}
        <div className="flex flex-col gap-1.5 sf-card p-3 bg-muted/30">
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
              className="text-xs bg-card border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-[200px]"
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
      <div className="flex-1 overflow-y-auto py-6 hide-scrollbar relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">{t('emptyTitle', 'Ask AI Advisory about your farm')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 mb-8">
              {t('emptySubtitle', 'Ask a question about your crops, soil, irrigation, pests, or weather response.')}
            </p>
            
            <div className="flex flex-col gap-2 w-full max-w-sm">
              <Button variant="outline" className="justify-start text-left h-auto py-3 whitespace-normal" onClick={() => setInput(t('example1', 'Why are my leaves turning yellow?'))}>
                {t('example1', 'Why are my leaves turning yellow?')}
              </Button>
              <Button variant="outline" className="justify-start text-left h-auto py-3 whitespace-normal" onClick={() => setInput(t('example2', 'How often should I irrigate this crop?'))}>
                {t('example2', 'How often should I irrigate this crop?')}
              </Button>
              <Button variant="outline" className="justify-start text-left h-auto py-3 whitespace-normal" onClick={() => setInput(t('example3', 'What should I check for pest damage?'))}>
                {t('example3', 'What should I check for pest damage?')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pb-4" role="list">
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
      <div className="shrink-0 pt-4 bg-background">
        <ChatInput 
          value={input}
          onChange={setInput}
          onSend={handleSend} 
          isPending={generateAdvisory.isPending} 
          disabled={!activeFarmId}
        />
      </div>
    </div>
  );
}
