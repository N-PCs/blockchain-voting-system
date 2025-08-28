import React from 'react';

function BlockchainViewer({ chain }) {
  return (
    <div>
      <h2>Blockchain</h2>
      {chain.map((block, index) => (
        <div key={index} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <p><strong>Block {block.index}</strong></p>
          <p>Timestamp: {new Date(block.timestamp * 1000).toLocaleString()}</p>
          <p>Proof: {block.proof}</p>
          <p>Previous Hash: {block.previous_hash}</p>
          <p>Votes: {block.votes.length > 0 ? block.votes.map(v => `${v.candidate} (Voter: ${v.voter_hash.slice(0,10)}...)`).join(', ') : 'None'}</p>
        </div>
      ))}
    </div>
  );
}

export default BlockchainViewer;