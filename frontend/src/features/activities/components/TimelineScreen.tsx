import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Client } from '@stomp/stompjs';
import { 
  CalendarDays, 
  Activity as ActivityIcon, 
  Clock, 
  MapPin, 
  User 
} from 'lucide-react';
import { useFarmStore } from '@/store/farmStore';
import { useActivities } from '../api/activityApi';
import type { FarmActivity } from '@/types/activity';
import { format } from 'date-fns';

export default function TimelineScreen() {
  const { activeFarmId } = useFarmStore();
  const queryClient = useQueryClient();

  // Fetch initial activities
  const { data: initialData = [], isLoading, error } = useActivities({ farmId: activeFarmId || undefined });

  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const stompClientRef = useRef<Client | null>(null);

  // Sync initial data to local state for fast real-time updates
  useEffect(() => {
    if (initialData) {
      setActivities(initialData);
    }
  }, [initialData]);

  // STOMP WebSocket Connection
  useEffect(() => {
    if (!activeFarmId) return;

    // Use ws:// for http and wss:// for https
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If backend is on 8080 (Vite proxy doesn't handle WS by default unless configured, let's connect directly or via proxy)
    // Assuming backend runs on 8080 during dev. The vite config proxy might route /ws. Let's use standard /ws endpoint.
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`Connected to WebSocket, subscribing to farm ${activeFarmId}`);
        
        client.subscribe(`/topic/farm/${activeFarmId}/activities`, (message) => {
          if (message.body) {
            try {
              const event = JSON.parse(message.body);
              handleRealTimeEvent(event);
            } catch (err) {
              console.error('Error parsing STOMP message', err);
            }
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [activeFarmId]);

  const handleRealTimeEvent = (event: any) => {
    setActivities((prev) => {
      let updated = [...prev];
      
      switch (event.eventType) {
        case 'CREATED':
          // Add new activity at the top, avoid duplicates
          if (!updated.some(a => a.id === event.activity.id)) {
            updated.unshift(event.activity);
          }
          break;
          
        case 'UPDATED':
          // Update existing activity
          updated = updated.map(a => 
            a.id === event.activity.id ? event.activity : a
          );
          break;
          
        case 'DELETED':
          // Remove deleted activity
          updated = updated.filter(a => a.id !== event.activityId);
          break;
      }
      
      // Keep sorted chronologically (newest first based on scheduledDate or createdAt)
      return updated.sort((a, b) => {
        const dateA = new Date(a.scheduledDate || a.createdAt).getTime();
        const dateB = new Date(b.scheduledDate || b.createdAt).getTime();
        return dateB - dateA;
      });
    });

    // Also invalidate react-query cache so other screens sync up
    queryClient.invalidateQueries({ queryKey: ['activities'] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'CANCELLED': return 'bg-red-500';
      case 'PLANNED':
      default: return 'bg-amber-500';
    }
  };

  if (!activeFarmId) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground p-8">
        <ActivityIcon className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg">Please select a farm to view the timeline.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24 sf-fade-in h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            Real-Time Timeline
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Live updates of all activities in your farm.
          </p>
        </div>
        
        {/* Connection indicator */}
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          Live
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-12 flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-muted mt-2"></div>
                  <div className="w-0.5 h-full bg-muted my-1"></div>
                </div>
                <div className="flex-1 bg-card border border-border h-24 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-destructive/10 text-destructive rounded-lg flex flex-col items-center justify-center">
            <p>Failed to load timeline.</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <Clock className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg">No activities found.</p>
            <p className="text-sm">Create an activity to see it appear here in real-time.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-border -z-10"></div>
            
            <div className="flex flex-col gap-6">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-4 sf-slide-up group">
                  {/* Timeline dot */}
                  <div className="w-12 flex flex-col items-center pt-1.5 z-10">
                    <div className={`w-3.5 h-3.5 rounded-full ring-4 ring-background ${getStatusColor(activity.status)}`} />
                  </div>
                  
                  {/* Content card */}
                  <div className="flex-1 bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{activity.title}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium text-white ${getStatusColor(activity.status)}`}>
                        {activity.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mt-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {format(new Date(activity.scheduledDate || activity.createdAt), 'MMM d, yyyy h:mm a')}
                      </div>
                      
                      {activity.fieldName && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {activity.fieldName} {activity.cropName ? `(${activity.cropName})` : ''}
                        </div>
                      )}
                      
                      {activity.performedByName && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          {activity.performedByName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
