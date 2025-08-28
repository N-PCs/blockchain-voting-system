import React, { useState } from 'react';
import axios from 'axios';

function VoterForm() {
  const [voterId, setVoterId] = useState('');
  const [candidate, setCandidate] = useState('Candidate A');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/vote', { voter_id: voterId, candidate });
      alert('Vote submitted!');
    } catch (error) {
      alert(error.response.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Voter ID"
        value={voterId}
        onChange={(e) => setVoterId(e.target.value)}
        required
      />
      <select value={candidate} onChange={(e) => setCandidate(e.target.value)}>
        <option value="Candidate A">Candidate A</option>
        <option value="Candidate B">Candidate B</option>
        <option value="Candidate C">Candidate C</option>
      </select>
      <button type="submit">Cast Vote</button>
    </form>
  );
}

export default VoterForm;