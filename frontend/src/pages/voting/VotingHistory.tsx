import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Alert, Button } from 'react-bootstrap';
import { FaHistory, FaCheckCircle, FaClock, FaLink } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface VoteHistory {
  vote_id: string;
  election: {
    id: string;
    title: string;
    type: string;
  };
  candidate: {
    name: string;
    party_affiliation: string;
  };
  casted_at: string;
  status: string;
  verified_in_blockchain: boolean;
}

const VotingHistory: React.FC = () => {
  const [votes, setVotes] = useState<VoteHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchVotingHistory();
  }, []);

  const fetchVotingHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/votes/history');
      if (response.data.success) {
        setVotes(response.data.data.votes);
      } else {
        setError('Failed to load voting history');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load voting history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'invalid': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading voting history..." />;
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Voting History</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchVotingHistory}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0">Voting History</h1>
          <p className="text-muted">Your complete voting record</p>
        </div>
      </div>

      {votes.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <FaHistory size={48} className="text-muted mb-3" />
            <h4>No Voting History</h4>
            <p className="text-muted">You haven't voted in any elections yet.</p>
            <Button variant="primary" href="/elections">
              Browse Elections
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Election</th>
                    <th>Candidate</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Blockchain</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.map((vote, index) => (
                    <tr key={index}>
                      <td>
                        <div>
                          <strong>{vote.election.title}</strong>
                          <br />
                          <small className="text-muted text-capitalize">
                            {vote.election.type}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          {vote.candidate.name || 'Unknown Candidate'}
                          {vote.candidate.party_affiliation && (
                            <>
                              <br />
                              <small className="text-muted">
                                {vote.candidate.party_affiliation}
                              </small>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        {formatDate(vote.casted_at)}
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(vote.status)} className="text-capitalize">
                          {vote.status === 'confirmed' && <FaCheckCircle className="me-1" />}
                          {vote.status === 'pending' && <FaClock className="me-1" />}
                          {vote.status}
                        </Badge>
                      </td>
                      <td>
                        {vote.verified_in_blockchain ? (
                          <Badge bg="success">
                            <FaLink className="me-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge bg="secondary">
                            <FaClock className="me-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {votes.length > 0 && (
        <Alert variant="info" className="mt-4">
          <Alert.Heading>About Blockchain Verification</Alert.Heading>
          <p className="mb-0">
            Votes marked as "Verified" have been confirmed on the blockchain and cannot be altered.
            Votes marked as "Pending" are still being processed by the blockchain network.
          </p>
        </Alert>
      )}
    </Container>
  );
};

export default VotingHistory;