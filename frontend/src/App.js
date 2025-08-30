import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import VoterForm from './components/VoterForm';
import Results from './components/Results';
import BlockchainViewer from './components/BlockchainViewer';
import BlockchainDemo from './components/BlockchainDemo';
import './App.css';

// Use relative path for API calls in production, absolute in development
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000' 
  : '';

// Connect to WebSocket only if in development or if we know the production URL
const socket = process.env.NODE_ENV === 'development' 
  ? io('http://localhost:5000') 
  : io({autoConnect: false});

function App() {
  const [message, setMessage] = useState('');
  const [results, setResults] = useState({});
  const [chain, setChain] = useState([]);
  const [pendingVotes, setPendingVotes] = useState([]);
  const [activeTab, setActiveTab] = useState('vote'); // 'vote', 'results', 'blockchain', 'demo'

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      socket.on('new_vote', (data) => {
        setMessage(data.message);
        fetchPendingVotes();
      });

      socket.on('new_block', (data) => {
        setMessage(data.message);
        fetchChain();
        fetchResults();
        fetchPendingVotes();
      });

      socket.on('update_results', (newResults) => {
        setResults(newResults);
      });
    }

    fetchResults();
    fetchChain();
    fetchPendingVotes();

    return () => {
      if (process.env.NODE_ENV === 'development') {
        socket.off('new_vote');
        socket.off('new_block');
        socket.off('update_results');
      }
    };
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch(`${API_BASE}/results`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const fetchChain = async () => {
    try {
      const response = await fetch(`${API_BASE}/chain`);
      const data = await response.json();
      setChain(data.chain);
    } catch (error) {
      console.error('Error fetching chain:', error);
    }
  };

  const fetchPendingVotes = async () => {
    try {
      const response = await fetch(`${API_BASE}/pending`);
      const data = await response.json();
      setPendingVotes(data);
    } catch (error) {
      console.error('Error fetching pending votes:', error);
    }
  };

  const mineBlock = async () => {
    try {
      await fetch(`${API_BASE}/mine`);
      fetchChain();
      fetchResults();
      fetchPendingVotes();
    } catch (error) {
      console.error('Error mining block:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Blockchain Voting System</h1>
        <nav className="tabs">
          <button 
            className={activeTab === 'vote' ? 'active' : ''} 
            onClick={() => setActiveTab('vote')}
          >
            Vote
          </button>
          <button 
            className={activeTab === 'results' ? 'active' : ''} 
            onClick={() => setActiveTab('results')}
          >
            Results
          </button>
          <button 
            className={activeTab === 'blockchain' ? 'active' : ''} 
            onClick={() => setActiveTab('blockchain')}
          >
            Blockchain
          </button>
          <button 
            className={activeTab === 'demo' ? 'active' : ''} 
            onClick={() => setActiveTab('demo')}
          >
            How It Works
          </button>
        </nav>
      </header>

      <div className="tab-content">
        {activeTab === 'vote' && (
          <div>
            <VoterForm onVoteSuccess={() => {
              fetchPendingVotes();
              setMessage('Vote submitted successfully! It will be added to the next block.');
            }} />
            <div className="pending-section">
              <h3>Pending Votes ({pendingVotes.length})</h3>
              {pendingVotes.length > 0 ? (
                <button onClick={mineBlock} className="mine-button">
                  Mine Block to Add Votes to Blockchain
                </button>
              ) : (
                <p>No pending votes. Cast a vote to see them here.</p>
              )}
              <ul>
                {pendingVotes.map((vote, index) => (
                  <li key={index}>
                    Voter: {vote.voter_hash.slice(0, 10)}... | Candidate: {vote.candidate}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <Results results={results} />
        )}

        {activeTab === 'blockchain' && (
          <BlockchainViewer chain={chain} />
        )}

        {activeTab === 'demo' && (
          <BlockchainDemo />
        )}
      </div>

      {message && <div className="message">{message}</div>}
    </div>
  );
}

export default App;