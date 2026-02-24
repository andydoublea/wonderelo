import { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, Trash2, Play, Pause, Filter, Copy, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { toast } from 'sonner@2.0.3';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

interface Log {
  timestamp: string;
  level: 'debug' | 'error' | 'info';
  message: string;
  args: any[];
}

export function ServerLogsViewer() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'debug' | 'error' | 'info'>('all');
  const [lastFetchTime, setLastFetchTime] = useState<string>('');
  const [lastFetchCount, setLastFetchCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchLogs = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      
      const response = await fetch(
        `${apiBaseUrl}/debug/server-logs?limit=200`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      
      console.log('[ServerLogsViewer] Fetched logs:', result.count, 'logs');
      
      if (response.ok) {
        // Don't clear existing logs if backend returns empty array (server cold start)
        // Only update if we got new logs
        if (result.logs && result.logs.length > 0) {
          // Use functional update to get current logs state
          setLogs(prevLogs => {
            // Merge with existing logs, avoid duplicates by timestamp
            const existingTimestamps = new Set(prevLogs.map(l => l.timestamp));
            const newLogs = result.logs.filter((log: Log) => !existingTimestamps.has(log.timestamp));
            
            if (newLogs.length > 0) {
              // Add new logs and sort by timestamp
              const merged = [...prevLogs, ...newLogs].sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
              
              // Keep only last 500 logs
              return merged.slice(-500);
            }
            
            // No new logs, return existing
            return prevLogs;
          });
        }
        
        if (!silent) {
          toast.success(`Loaded ${result.count} log entries`);
        }
        
        // Update last fetch time and count
        setLastFetchTime(new Date().toLocaleTimeString('sk-SK', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3
        }));
        setLastFetchCount(result.count);
      } else {
        console.error('[ServerLogsViewer] Error response:', result);
        if (!silent) {
          toast.error(result.error || 'Failed to load logs');
        }
      }
    } catch (error) {
      console.error('[ServerLogsViewer] Network error:', error);
      errorLog('Error fetching logs:', error);
      if (!silent) {
        toast.error('Network error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('🗑️ Clear all server logs?')) return;

    try {
      setIsLoading(true);
      
      const response = await fetch(
        `${apiBaseUrl}/debug/clear-logs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setLogs([]);
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Failed to clear logs');
      }
    } catch (error) {
      errorLog('Error clearing logs:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLogs = async () => {
    try {
      // Format logs for copying
      const logsText = filteredLogs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString('sk-SK', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3
        });
        return `[${time}] [${log.level.toUpperCase()}] ${log.message}`;
      }).join('\n');

      // Fallback method for copying (works in iframe/restricted contexts)
      const textarea = document.createElement('textarea');
      textarea.value = logsText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        const success = document.execCommand('copy');
        if (success) {
          setCopied(true);
          toast.success(`Copied ${filteredLogs.length} logs to clipboard`);
          
          // Reset copied state after 2 seconds
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error('execCommand failed');
        }
      } finally {
        document.body.removeChild(textarea);
      }
    } catch (error) {
      errorLog('Error copying logs:', error);
      toast.error('Failed to copy logs');
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      // Initial fetch
      fetchLogs(true);
      
      // Set up interval
      intervalRef.current = window.setInterval(() => {
        fetchLogs(true);
      }, 2000); // Refresh every 2 seconds
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [autoRefresh]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoRefresh) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoRefresh]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesText = !filterText || 
      log.message.toLowerCase().includes(filterText.toLowerCase()) ||
      JSON.stringify(log.args).toLowerCase().includes(filterText.toLowerCase());
    return matchesLevel && matchesText;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'debug': return 'text-blue-600 bg-blue-50';
      case 'info': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-600 text-white';
      case 'debug': return 'bg-blue-600 text-white';
      case 'info': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-purple-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Server logs viewer
            </CardTitle>
            <CardDescription>
              Real-time backend logs from the Supabase Edge Function
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border">
            {autoRefresh ? <Play className="w-4 h-4 text-green-600" /> : <Pause className="w-4 h-4 text-gray-400" />}
            <span className="text-sm font-medium">{autoRefresh ? 'Live' : 'Paused'}</span>
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              className="scale-125"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex gap-2 flex-wrap items-center">
          <Button 
            onClick={() => fetchLogs()} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={copyLogs} 
            disabled={filteredLogs.length === 0}
            variant="outline"
            size="sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy logs
              </>
            )}
          </Button>
          
          <Button 
            onClick={clearLogs} 
            disabled={isLoading}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear logs
          </Button>

          <div className="flex gap-2 items-center ml-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="px-2 py-1 text-sm border rounded"
            >
              <option value="all">All levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="error">Error</option>
            </select>
            
            <Input
              placeholder="Filter logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-64"
              size="sm"
            />
          </div>
        </div>

        {/* Logs Display */}
        <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-lg h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {logs.length === 0 ? (
                <>
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No logs yet. Click "Refresh" to load server logs.</p>
                  <p className="text-xs mt-2">Or enable "Live" mode for auto-refresh.</p>
                </>
              ) : (
                <p>No logs match the current filters.</p>
              )}
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div key={idx} className="mb-2 border-b border-gray-800 pb-2">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString('sk-SK', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      fractionalSecondDigits: 3
                    })}
                  </span>
                  <span className={`px-1 rounded text-[10px] ${getLevelBadgeColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="flex-1 break-all">
                    {log.message}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Total: {logs.length}</span>
          <span>Filtered: {filteredLogs.length}</span>
          <span>Debug: {logs.filter(l => l.level === 'debug').length}</span>
          <span>Errors: {logs.filter(l => l.level === 'error').length}</span>
          <span>Info: {logs.filter(l => l.level === 'info').length}</span>
          {lastFetchTime && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-blue-600">Last fetch: {lastFetchTime}</span>
              <span className="text-purple-600">Received: {lastFetchCount} logs</span>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
          <p><strong>💡 How to use:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Toggle <strong>"Live"</strong> mode for automatic refresh every 2 seconds</li>
            <li>Use filters to find specific log messages or levels</li>
            <li>Click "Clear logs" to reset the server's log buffer</li>
            <li>Logs are stored in server memory and persist until cleared or server restart</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}