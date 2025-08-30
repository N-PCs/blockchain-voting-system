import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function EnhancedResults({ results }) {
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  
  const candidates = Object.keys(results);
  const votes = Object.values(results);
  const totalVotes = votes.reduce((sum, vote) => sum + vote, 0);
  
  // Chart options with animations
  const barOptions = {
    responsive: true,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Vote Count by Candidate',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Votes'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Candidates'
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Vote Distribution',
        font: {
          size: 16
        }
      },
    },
  };

  const chartData = {
    labels: candidates,
    datasets: [
      {
        label: 'Votes',
        data: votes,
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Update charts when results change
  useEffect(() => {
    if (barChartRef.current && pieChartRef.current) {
      barChartRef.current.update();
      pieChartRef.current.update();
    }
  }, [results]);

  const percentages = votes.map(vote => 
    totalVotes > 0 ? ((vote / totalVotes) * 100).toFixed(1) : 0
  );

  return (
    <div className="results-container">
      <h2>Real-Time Voting Results</h2>
      
      <div className="results-summary">
        <div className="summary-card">
          <h3>Total Votes</h3>
          <div className="total-votes">{totalVotes}</div>
        </div>
        <div className="summary-card">
          <h3>Candidates</h3>
          <div className="candidate-count">{candidates.length}</div>
        </div>
        <div className="summary-card">
          <h3>Leading Candidate</h3>
          <div className="leading-candidate">
            {totalVotes > 0 ? candidates[votes.indexOf(Math.max(...votes))] : 'None'}
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-wrapper">
          <Bar ref={barChartRef} options={barOptions} data={chartData} />
        </div>
        
        <div className="chart-wrapper">
          <Pie ref={pieChartRef} options={pieOptions} data={chartData} />
        </div>
      </div>

      <div className="detailed-results">
        <h3>Detailed Breakdown</h3>
        <table className="results-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Votes</th>
              <th>Percentage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate, index) => {
              const isLeading = votes[index] === Math.max(...votes) && totalVotes > 0;
              return (
                <tr key={candidate}>
                  <td>{candidate}</td>
                  <td>{votes[index]}</td>
                  <td>{percentages[index]}%</td>
                  <td>
                    {isLeading ? (
                      <span className="leading-badge">Leading</span>
                    ) : (
                      <span className="regular-badge">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EnhancedResults;