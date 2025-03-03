// frontend/src/components/SessionLogs.tsx
import React from 'react';

interface SessionLogsProps {
  transcript: string;
  transcriptHistory: Array<{
    text: string;
    isFinal: boolean;
    confidence: number;
    timestamp: number;
  }>;
  systemActions: Array<{
    action: string;
    details: string;
    timestamp: number;
    status?: 'success' | 'error' | 'pending' | 'info';
  }>;
  isListening: boolean;
  confidence: number;
  setTranscriptHistory: React.Dispatch<React.SetStateAction<Array<{
    text: string;
    isFinal: boolean;
    confidence: number;
    timestamp: number;
  }>>>;
  setSystemActions: React.Dispatch<React.SetStateAction<Array<{
    action: string;
    details: string;
    timestamp: number;
    status?: 'success' | 'error' | 'pending' | 'info';
  }>>>;
}

const SessionLogs: React.FC<SessionLogsProps> = ({
  transcript,
  transcriptHistory,
  systemActions,
  isListening,
  confidence,
  setTranscriptHistory,
  setSystemActions
}) => {
  const getConfidenceClass = () => {
    if (confidence > 0.8) return 'text-green-500';
    if (confidence > 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'success': return 'text-success border-success/30 bg-success/10';
      case 'error': return 'text-error border-error/30 bg-error/10';
      case 'pending': return 'text-warning border-warning/30 bg-warning/10';
      case 'info':
      default: return 'text-info border-info/30 bg-info/10';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': 
        return (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  // Create a ref for the logs container to scroll to bottom
  const logsContainerRef = React.useRef<HTMLDivElement>(null);
  
  // State to track the active tab and auto-scroll feature
  const [activeTab, setActiveTab] = React.useState<'all' | 'transcripts' | 'actions'>('all');
  const [autoScroll, setAutoScroll] = React.useState(true);
  
  // Effect to scroll to bottom when logs change
  React.useEffect(() => {
    if (logsContainerRef.current && autoScroll) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [transcriptHistory, systemActions, activeTab, autoScroll]);
  
  return (
    <div className="session-logs mt-4 p-3 bg-base-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Session Logs</h3>
        <div className="flex gap-2">
          <button 
            className="text-xs px-2 py-1 rounded bg-base-300 hover:bg-base-300/80" 
            onClick={() => setTranscriptHistory([])}
          >
            Clear Transcripts
          </button>
          <button 
            className="text-xs px-2 py-1 rounded bg-base-300 hover:bg-base-300/80" 
            onClick={() => setSystemActions([])}
          >
            Clear Actions
          </button>
        </div>
      </div>

      {/* Tabs for different sections */}
      <div className="tabs tabs-boxed mb-4">
        <a 
          className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Activity
        </a>
        <a 
          className={`tab ${activeTab === 'transcripts' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('transcripts')}
        >
          Transcripts
        </a>
        <a 
          className={`tab ${activeTab === 'actions' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          System Actions
        </a>
      </div>

      {/* Live Transcript Section */}
      <div className="bg-base-100 p-3 rounded-lg mb-4 border border-base-300">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Live Transcript:</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isListening ? 'bg-success/20 text-success' : 'bg-base-300 text-base-content/60'}`}>
              {isListening ? 'Listening' : 'Idle'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-xs opacity-70 mr-2">Confidence:</span>
            <div className="w-24 h-2 bg-base-300 rounded-full overflow-hidden">
              <div
                className={`h-full ${confidence > 0.8 ? 'bg-success' : confidence > 0.5 ? 'bg-warning' : 'bg-error'}`}
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-xs ml-2">{Math.round(confidence * 100)}%</span>
          </div>
        </div>

        {transcript ? (
          <p className={`text-lg ${getConfidenceClass()}`}>
            {transcript}
          </p>
        ) : (
          <p className="text-base-content/40">
            {isListening ? 'Listening...' : 'Say something to start'}
          </p>
        )}
      </div>

      {/* Activity Log with dynamic heading based on tab */}
      <div className="activity-log">
        <div className="flex justify-between items-center text-xs text-base-content/60 mb-2">
          <span>
            {activeTab === 'all' ? 'Activity Log' : 
             activeTab === 'transcripts' ? 'Transcript History' : 
             'System Actions Log'}
          </span>
          <label className="flex items-center cursor-pointer gap-1">
            <span>Auto-scroll</span>
            <input 
              type="checkbox" 
              className="toggle toggle-xs toggle-primary" 
              checked={autoScroll}
              onChange={() => setAutoScroll(!autoScroll)}
            />
          </label>
        </div>
        
        {(() => {
          // Create filtered items based on active tab
          const items = (() => {
            if (activeTab === 'all') {
              return [
                ...transcriptHistory.map(item => ({
                  type: 'transcript',
                  timestamp: item.timestamp,
                  data: item
                })), 
                ...systemActions.map(item => ({
                  type: 'action',
                  timestamp: item.timestamp,
                  data: item
                }))
              ];
            } else if (activeTab === 'transcripts') {
              return transcriptHistory.map(item => ({
                type: 'transcript',
                timestamp: item.timestamp,
                data: item
              }));
            } else { // actions tab
              return systemActions.map(item => ({
                type: 'action',
                timestamp: item.timestamp,
                data: item
              }));
            }
          })();
          
          // Check if there are items to display
          if (items.length === 0) {
            return (
              <div className="p-2 bg-base-300 rounded text-center text-sm opacity-50">
                {activeTab === 'all' ? 'No activity recorded yet' : 
                 activeTab === 'transcripts' ? 'No transcriptions yet' : 
                 'No system actions yet'}
              </div>
            );
          }
          
          // Sort and render items
          return (
            <div ref={logsContainerRef} className="overflow-y-auto max-h-[300px] space-y-1">
              {items.sort((a, b) => a.timestamp - b.timestamp)
                .map((item, index) => (
              <div
                key={item.timestamp + index}
                className={`p-2 rounded text-sm border ${item.type === 'transcript' ? 'bg-base-300' : getStatusClass(item.type === 'action' ? item.data.status : undefined)}`}
              >
                {item.type === 'transcript' ? (
                  // Transcript item
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-base-content/10">User</span>
                      <span className={item.data.confidence > 0.8 ? 'text-success' : item.data.confidence > 0.5 ? 'text-warning' : 'text-error'}>
                        {item.data.text}
                      </span>
                    </div>
                    <span className="text-xs opacity-50">
                      {new Date(item.data.timestamp).toLocaleTimeString()} ({Math.round(item.data.confidence * 100)}%)
                    </span>
                  </div>
                ) : (
                  // System action item
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-base-content/10">System</span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(item.data.status)}
                        <span className="font-medium">{item.data.action}:</span>
                        <span>{item.data.details}</span>
                      </div>
                    </div>
                    <span className="text-xs opacity-50">
                      {new Date(item.data.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
                ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default SessionLogs;