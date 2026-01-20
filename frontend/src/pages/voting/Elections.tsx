import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaVoteYea, FaCalendarAlt, FaUsers } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Election {
  id: string;
  uuid: string;
  title: string;
  description: string;
  election_type: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

const Elections: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/elections');
      if (response.data.success) {
        setElections(response.data.data);
      } else {
        setError('Failed to load elections');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'secondary';
      case 'completed': return 'info';
      case 'cancelled': return 'danger';
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

  const canVoteInElection = (election: Election) => {
    if (!user || user.registrationStatus !== 'verified') return false;
    if (election.status !== 'active') return false;

    const now = new Date();
    const startDate = new Date(election.start_date);
    const endDate = new Date(election.end_date);

    return now >= startDate && now <= endDate;
  };

  if (loading) {
    return <LoadingSpinner message="Loading elections..." />;
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Elections</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchElections}>
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
          <h1 className="mb-0">Elections</h1>
          <p className="text-muted">Choose an election to participate in</p>
        </div>
      </div>

      {user?.registrationStatus !== 'verified' && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>Registration Required</Alert.Heading>
          <p>
            You need to be verified to participate in elections.
            {user?.registrationStatus === 'pending' && ' Your registration is pending approval.'}
            {user?.registrationStatus === 'rejected' && ' Your registration was rejected. Please contact support.'}
          </p>
        </Alert>
      )}

      {elections.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <FaVoteYea size={48} className="text-muted mb-3" />
            <h4>No Elections Available</h4>
            <p className="text-muted">There are currently no elections available for voting.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {elections.map((election) => (
            <Col md={6} lg={4} key={election.id} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0">{election.title}</h5>
                    <Badge bg={getStatusBadgeVariant(election.status)} className="text-capitalize">
                      {election.status}
                    </Badge>
                  </div>

                  <p className="text-muted small mb-3">{election.description}</p>

                  <div className="election-details mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FaCalendarAlt className="text-primary me-2" size={14} />
                      <small className="text-muted">
                        {formatDate(election.start_date)} - {formatDate(election.end_date)}
                      </small>
                    </div>

                    <div className="d-flex align-items-center">
                      <FaUsers className="text-primary me-2" size={14} />
                      <small className="text-muted text-capitalize">
                        {election.election_type} Election
                      </small>
                    </div>
                  </div>

                  <div className="mt-auto">
                    {canVoteInElection(election) ? (
                      <Button
                        as={Link as any}
                        to={`/elections/${election.uuid}/vote`}
                        variant="primary"
                        className="w-100"
                      >
                        <FaVoteYea className="me-2" />
                        Vote Now
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-100" disabled>
                        {election.status === 'draft' && 'Election Not Started'}
                        {election.status === 'completed' && 'Election Completed'}
                        {election.status === 'cancelled' && 'Election Cancelled'}
                        {user?.registrationStatus !== 'verified' && 'Registration Required'}
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Elections;