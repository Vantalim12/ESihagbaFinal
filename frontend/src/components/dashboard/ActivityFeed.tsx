import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Calendar,
  FileText,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useBackend } from '@/context/BackendContext';

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  details: string;
  timestamp: Date;
  userId: string;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'CreateTransaction':
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    case 'UpdateTransaction':
      return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
    case 'CreateWallet':
      return <Wallet className="h-4 w-4 text-purple-500" />;
    case 'CreateEvent':
    case 'UpdateEvent':
      return <Calendar className="h-4 w-4 text-orange-500" />;
    case 'CreateBudget':
    case 'UpdateBudget':
      return <FileText className="h-4 w-4 text-indigo-500" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'CreateTransaction':
      return 'bg-green-500/10';
    case 'UpdateTransaction':
      return 'bg-blue-500/10';
    case 'CreateWallet':
      return 'bg-purple-500/10';
    case 'CreateEvent':
    case 'UpdateEvent':
      return 'bg-orange-500/10';
    case 'CreateBudget':
    case 'UpdateBudget':
      return 'bg-indigo-500/10';
    default:
      return 'bg-muted';
  }
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { actor, isConnected } = useBackend();

  useEffect(() => {
    fetchRecentActivity();
  }, [actor, isConnected]);

  const fetchRecentActivity = async () => {
    if (!actor) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await (actor as any).getRecentActivity(BigInt(10));

      const activityData: AuditLog[] = result.map((item: any) => {
        // Extract action from variant
        const actionKey = Object.keys(item.action)[0];

        return {
          id: Number(item.id),
          action: actionKey,
          entityType: item.entityType,
          details: item.details,
          timestamp: new Date(Number(item.timestamp) / 1000000), // Convert nanoseconds to milliseconds
          userId: item.userId.toText ? item.userId.toText().slice(0, 10) + '...' : 'unknown',
        };
      });

      setActivities(activityData);
    } catch (error) {
      console.error('Failed to fetch activity:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <Activity className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                {getActionIcon(activity.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {activity.details}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{activity.userId}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
