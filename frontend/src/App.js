import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import VoterForm from './components/VoterForm';
import Results from './components/Results';
import BlockchainViewer from './components/BlockchainViewer';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [message, setMessage] = useState('');
  const [results, setResults] = useState({});
  const [chain, setChain] = useState([]);

  useEffect(() => {
    socket.on('new_vote', (data) => {
      setMessage(data.message);
    });

    socket.on('new_block', (data) => {
      setMessage(data.message);
      fetchChain();
    });

    socket.on('update_results', (newResults) => {
      setResults(newResults);
    });

    fetchResults();
    fetchChain();

    return () => {
      socket.off('new_vote');
      socket.off('new_block');
      socket.off('update_results');
    };
  }, []);

  const fetchResults = async () => {
    const response = await fetch('/results');
    const data = await response.json();
    setResults(data);
  };

  const fetchChain = async () => {
    const response = await fetch('/chain');
    const data = await response.json();
    setChain(data.chain);
  };

  const mineBlock = async () => {
    await fetch('/mine');
  };

  return (
    <div className="App">
      <h1>Blockchain Voting System</h1>
      <VoterForm />
      <button onClick={mineBlock}>Mine Block</button>
      <p>{message}</p>
      <Results results={results} />
      <BlockchainViewer chain={chain} />
    </div>
  );
}

export default App;