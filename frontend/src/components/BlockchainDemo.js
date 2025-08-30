import React from 'react';

function BlockchainDemo() {
  return (
    <div className="blockchain-demo">
      <h2>How Blockchain Voting Works</h2>
      
      <div className="demo-step">
        <h3>1. Casting a Vote</h3>
        <p>When you cast a vote, it's added to a pool of pending votes. Your voter ID is hashed for privacy, ensuring your vote remains anonymous while preventing double voting.</p>
      </div>
      
      <div className="demo-step">
        <h3>2. Mining a Block</h3>
        <p>When the "Mine Block" button is clicked, all pending votes are bundled into a new block. This process involves solving a complex mathematical problem (Proof of Work) to secure the block.</p>
      </div>
      
      <div className="demo-step">
        <h3>3. Adding to the Blockchain</h3>
        <p>Once mined, the new block is added to the blockchain. Each block contains a cryptographic hash of the previous block, creating an immutable chain. If anyone tries to alter a vote, the hashes would change, making tampering evident.</p>
        
        <div className="demo-visual">
          <div className="block-visual">
            <div className="block-index">Block 1</div>
            <div className="block-hash">a1b2c3...</div>
          </div>
          <div className="block-visual">
            <div className="block-index">Block 2</div>
            <div className="block-hash">d4e5f6...</div>
          </div>
          <div className="block-visual">
            <div className="block-index">Block 3</div>
            <div className="block-hash">g7h8i9...</div>
          </div>
        </div>
      </div>
      
      <div className="demo-step">
        <h3>4. Verifying Results</h3>
        <p>Anyone can verify the election results by examining the blockchain. The transparent yet anonymous nature of the system ensures trust in the voting process without compromising voter privacy.</p>
      </div>
      
      <div className="demo-step">
        <h3>Security Features</h3>
        <ul>
          <li><strong>Immutability:</strong> Once recorded, votes cannot be altered</li>
          <li><strong>Transparency:</strong> All votes are publicly verifiable</li>
          <li><strong>Anonymity:</strong> Voter identities are protected through hashing</li>
          <li><strong>Prevention of Double Voting:</strong> The system tracks hashed voter IDs</li>
        </ul>
      </div>
    </div>
  );
}

export default BlockchainDemo;