import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { Activity, Shield, Upload, UserMinus, UserPlus } from 'lucide-react';
import { useMedChainApi } from '../../hooks/useMedChainApi';

export const AuditLog = ({ role = 'patient', account }) => {
  const medApi = useMedChainApi();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    medApi.getActivity(account)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [account]);

  const getIcon = (type) => {
    const normalized = type.toLowerCase();
    if (normalized.includes('upload')) return <Upload className="h-5 w-5 text-sky-500" />;
    if (normalized.includes('grant')) return <UserPlus className="h-5 w-5 text-emerald-500" />;
    if (normalized.includes('revoke')) return <UserMinus className="h-5 w-5 text-rose-500" />;
    if (normalized.includes('login')) return <Shield className="h-5 w-5 text-indigo-500" />;
    return <Activity className="h-5 w-5 text-slate-500" />;
  };

  if (loading) return <Spinner />;

  return (
    <Card className="border border-sky-100">
      <CardHeader>
        <CardTitle>{role === 'doctor' ? 'My Activity' : 'My Activity Log'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul className="-mb-8">
            {events.map((event, index) => (
              <li key={event._id}>
                <div className="relative pb-8">
                  {index !== events.length - 1 && <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200" />}
                  <div className="relative flex gap-3">
                    <div className="rounded-full bg-white ring-8 ring-white">{getIcon(event.activityType)}</div>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-col justify-between gap-1 sm:flex-row">
                        <p className="text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">{event.activityType}</span>
                          {event.relatedName ? ` with ${event.relatedName}` : ''}
                        </p>
                        <time className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {events.length === 0 && (
              <li className="py-8 text-center text-sm text-slate-500">No activity yet.</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
