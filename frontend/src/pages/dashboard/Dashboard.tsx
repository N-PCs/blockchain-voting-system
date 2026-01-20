import React from 'react';
import { Container, Row, Col, Card, Alert, Badge } from 'react-bootstrap';
import {
  FaVoteYea,
  FaUsers,
  FaLink,
  FaTachometerAlt,
  FaExclamationTriangle
} from 'react-icons/fa';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0">
            <FaTachometerAlt className="me-2" />
            Dashboard
          </h1>
          <p className="text-muted">Welcome back, {user?.firstName || 'User'}!</p>
        </div>
        <Badge bg={isConnected ? 'success' : 'danger'} className="fs-6">
          {isConnected ? '🟢 Online' : '🔴 Offline'}
        </Badge>
      </div>

      {user?.registrationStatus !== 'verified' && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>
            <FaExclamationTriangle className="me-2" />
            Account Verification Required
          </Alert.Heading>
          <p className="mb-0">
            Your account needs to be verified before you can participate in elections.
            {user?.registrationStatus === 'pending' && ' Your registration is pending approval.'}
            {user?.registrationStatus === 'rejected' && ' Your registration was rejected. Please contact support.'}
          </p>
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaVoteYea size={48} className="text-primary mb-3" />
              <h3>0</h3>
              <p className="text-muted mb-0">Total Votes Cast</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaUsers size={48} className="text-success mb-3" />
              <h3>0</h3>
              <p className="text-muted mb-0">Active Elections</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaLink size={48} className="text-info mb-3" />
              <h3>0</h3>
              <p className="text-muted mb-0">Blockchain Blocks</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-3">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <a href="/elections" className="btn btn-primary">
                  <FaVoteYea className="me-2" />
                  Browse Elections
                </a>
                <a href="/votes/history" className="btn btn-outline-primary">
                  View Voting History
                </a>
                <a href="/blockchain" className="btn btn-outline-primary">
                  <FaLink className="me-2" />
                  Blockchain Explorer
                </a>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-3">
          <Card>
            <Card.Header>
              <h5 className="mb-0">System Status</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <strong>WebSocket:</strong>
                <Badge bg={isConnected ? 'success' : 'danger'} className="ms-2">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <div className="mb-2">
                <strong>User Type:</strong>
                <Badge bg="secondary" className="ms-2 text-capitalize">
                  {user?.userType || 'voter'}
                </Badge>
              </div>
              <div>
                <strong>Registration:</strong>
                <Badge
                  bg={
                    user?.registrationStatus === 'verified' ? 'success' :
                    user?.registrationStatus === 'pending' ? 'warning' : 'danger'
                  }
                  className="ms-2 text-capitalize"
                >
                  {user?.registrationStatus || 'unknown'}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
      const electionsRes = await api.getActiveElections();
