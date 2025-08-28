import React from 'react';

function Results({ results }) {
  return (
    <div>
      <h2>Real-Time Results</h2>
      <ul>
        {Object.entries(results).map(([candidate, votes]) => (
          <li key={candidate}>{candidate}: {votes} votes</li>
        ))}
      </ul>
    </div>
  );
}

export default Results;