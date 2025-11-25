import React, { useState, useEffect } from 'react';
import ThreadList from './components/ThreadList';
import ThreadView from './components/ThreadView';
import './App.css';

function App() {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const allThreads = await window.electronAPI.getAllThreads();
      setThreads(allThreads);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load threads:', error);
      setLoading(false);
    }
  };

  const handleCreateThread = async (title, description) => {
    try {
      const newThread = await window.electronAPI.createThread({ title, description });
      await loadThreads();
      setSelectedThread(newThread);
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  const handleUpdateThread = async (threadId, title, description) => {
    try {
      await window.electronAPI.updateThread({ id: threadId, title, description });
      await loadThreads();
    } catch (error) {
      console.error('Failed to update thread:', error);
    }
  };

  const handleDeleteThread = async (threadId) => {
    try {
      await window.electronAPI.deleteThread({ id: threadId });
      await loadThreads();
      if (selectedThread?.id === threadId) {
        setSelectedThread(null);
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <ThreadList
        threads={threads}
        selectedThread={selectedThread}
        onSelectThread={handleSelectThread}
        onCreateThread={handleCreateThread}
        onUpdateThread={handleUpdateThread}
        onDeleteThread={handleDeleteThread}
      />
      <ThreadView
        thread={selectedThread}
        onThreadUpdated={loadThreads}
      />
    </div>
  );
}

export default App;
