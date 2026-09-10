import { User, Sparkles, CloudRain, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AdvisorySource } from '../api/types';

export type ChatMessageData = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: AdvisorySource[];
  weatherUsed?: boolean;
};

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { t } = useTranslation('advisory');
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      role="listitem"
    >
      <div className={`flex max-w-[85%] sm:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-primary/20 text-primary' : 'bg-emerald-600 text-white'
          }`}
          aria-hidden="true"
        >
          {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>

        {/* Bubble */}
        <div
          className={`sf-card p-3 sm:p-4 rounded-2xl text-sm ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm border-transparent'
              : 'bg-card text-foreground rounded-tl-sm'
          }`}
        >
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </div>
          
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <details className="group">
                <summary className="flex items-center cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground transition-all list-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm px-1 -mx-1">
                  {t('sources', 'Knowledge sources used for this advisory')}
                  <ChevronDown className="w-4 h-4 ml-2 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3 flex flex-col gap-2">
                  {message.sources.map((src, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-3 text-xs border border-border/50 break-words">
                      <div className="font-semibold text-foreground mb-1 break-words">{src.title || 'Knowledge Document'}</div>
                      {src.source && (
                        <div className="text-muted-foreground break-words">
                          Source: {src.source}
                        </div>
                      )}
                      {(src.authority || src.sourceType) && (
                        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-2 gap-y-1">
                          {src.authority && <span>Authority: {src.authority}</span>}
                          {src.sourceType && <span>Type: {src.sourceType}</span>}
                          {src.version && <span>v{src.version}</span>}
                        </div>
                      )}
                      {(src.publishedDate || src.lastVerifiedAt) && (
                        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-2 gap-y-1">
                          {src.publishedDate && <span>Published: {src.publishedDate}</span>}
                          {src.lastVerifiedAt && <span>Verified: {src.lastVerifiedAt}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {!isUser && message.weatherUsed && (
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-500/80 bg-blue-500/10 w-fit px-2 py-1 rounded-md">
              <CloudRain className="w-3.5 h-3.5" />
              <span>{t('weatherConsidered', 'Weather context was considered for this advisory.')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
