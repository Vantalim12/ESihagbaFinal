import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useBackend } from '@/context/BackendContext';

interface Event {
  id: number;
  title: string;
  location: string;
  startDate: Date;
  endDate: Date;
  budgetAllocated: number;
  status: 'upcoming' | 'ongoing';
}

export function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { actor, isConnected } = useBackend();

  useEffect(() => {
    fetchEvents();
  }, [actor, isConnected]);

  const fetchEvents = async () => {
    if (!actor) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await (actor as any).getUpcomingEvents(BigInt(5));

      const eventsData: Event[] = result.map((item: any) => {
        // Extract status from variant
        const statusKey = Object.keys(item.status)[0].toLowerCase();

        return {
          id: Number(item.id),
          title: item.title,
          location: item.location,
          startDate: new Date(Number(item.startDate) / 1000000), // Convert nanoseconds to milliseconds
          endDate: new Date(Number(item.endDate) / 1000000),
          budgetAllocated: Number(item.budgetAllocated),
          status: statusKey === 'ongoing' ? 'ongoing' : 'upcoming',
        };
      });

      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-slide-up" style={{ animationDelay: '250ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="animate-slide-up" style={{ animationDelay: '250ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming events scheduled</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up" style={{ animationDelay: '250ms' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {events.length} events
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.slice(0, 3).map((event, index) => (
            <div
              key={event.id}
              className="group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(event.startDate, { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {format(event.startDate, 'MMM d, yyyy')}
                </span>
                <span className="font-medium text-primary">
                  ₱{event.budgetAllocated.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
