import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Badge,
  ProgressBar,
  Modal,
  Spinner,
} from 'react-bootstrap';
import { FaVoteYea, FaCheckCircle, FaLock, FaShieldAlt, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// Components
import CandidateCard from '@/components/voting/CandidateCard';
import BlockchainVerification from '@/components/voting/BlockchainVerification';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';

// Types
import { Election, Candidate } from '@/types';

const Vote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const api = useApi();

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [voteResult, setVoteResult] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadElectionData();
    }
  }, [id]);

  const loadElectionData = async () => {
    try {
      setIsLoading(true);

      // Load election
      const electionRes = await api.getElection(id!);
      if (electionRes.success && electionRes.data) {
        setElection(electionRes.data);
      } else {
        toast.error('Election not found');
        navigate('/elections');
        return;
      }

      // Load candidates
      const candidatesRes = await api.getCandidates(id!);
      if (candidatesRes.success) {
        setCandidates(candidatesRes.data || []);
      }

      // Check eligibility
      const eligibilityRes = await api.checkEligibility(id!);
      if (eligibilityRes.success) {
        setEligibility(eligibilityRes.data);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading election data:', error);
      toast.error('Failed to load election data');
      setIsLoading(false);
    }
  };

  const handleCandidateSelect = (candidateId: string) => {
    setSelectedCandidate(candidateId);
  };

  const handleVoteSubmit = async () => {
    if (!selectedCandidate || !election) {
      toast.error('Please select a candidate');
      return;
    }

    setIsSubmitting(true);

    try {
      const voteData = {
        electionId: election.uuid,
        candidateId: selectedCandidate,
      };

      const response = await api.castVote(voteData);

      if (response.success && response.data) {
        setVoteResult(response.data);
        setShowConfirmModal(false);
        
        // Show success message
        toast.success(
          <div>
            <h6>Vote Cast Successfully!</h6>
            <p>Your vote has been recorded on the blockchain.</p>
            <small>Transaction ID: {response.data.transactionId}</small>
          </div>,
          { autoClose: 10000 }
        );

        // Redirect to vote verification after delay
        setTimeout(() => {
          navigate(`/votes/history`);
        }, 3000);
      } else {
        toast.error(response.error || 'Failed to cast vote');
      }
    } catch (error: any) {
      console.error('Error casting vote:', error);
      toast.error(error.response?.data?.error || 'Failed to cast vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderElectionStatus = () => {
    if (!election) return null;

    const now = new Date();
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);

    if (now < startDate) {
      return (
        <Alert variant="info">
          <FaClock className="me-2" />
          Voting starts on {format(startDate, 'PPpp')}
        </Alert>
      );
    }

    if (now > endDate) {
      return (
        <Alert variant="warning">
          <FaClock className="me-2" />
          Voting ended on {format(endDate, 'PPpp')}
        </Alert>
      );
    }

    // Calculate progress
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const progress = Math.min(100, (elapsed / totalDuration) * 100);

    return (
      <div className="mb-4">
        <div className="d-flex justify-content-between mb-1">
          <small>Voting Period</small>
          <small>
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </small>
        </div>
        <ProgressBar now={progress} variant="success" />
        <div className="d-flex justify-content-between mt-1">
          <small>Started: {format(startDate, 'MMM d, h:mm a')}</small>
          <small>Ends: {format(endDate, 'MMM d, h:mm a')}</small>
        </div>
      </div>
    );
  };

  const renderEligibilityStatus = () => {
    if (!eligibility) return null;

    if (eligibility.eligible) {
      return (
        <Alert variant="success">
          <FaCheckCircle className="me-2" />
          You are eligible to vote in this election!
        </Alert>
      );
    }

    return (
      <Alert variant="danger">
        <h6>You are not eligible to vote in this election</h6>
        <ul className="mb-0">
          {eligibility.reasons?.map((reason: string, index: number) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </Alert>
    );
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading election data...</p>
      </Container>
    );
  }

  if (!election) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Election not found or you don't have permission to access it.
        </Alert>
        <Button variant="primary" onClick={() => navigate('/elections')}>
          Back to Elections
        </Button>
      </Container>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <Container className="py-5">
        <Card>
          <Card.Header>
            <h4>{election.title}</h4>
            <p className="text-muted mb-0">{election.description}</p>
          </Card.Header>
          <Card.Body>
            {renderElectionStatus()}
            {renderEligibilityStatus()}
            <Button variant="primary" onClick={() => navigate('/elections')}>
              Back to Elections
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Election Header */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <Row className="align-items-center">
            <Col md={8}>
              <h3 className="mb-1">{election.title}</h3>
              <p className="mb-0">{election.description}</p>
            </Col>
            <Col md={4} className="text-md-end">
              <Badge bg="light" text="dark" className="me-2">
                {election.electionType.toUpperCase()}
              </Badge>
              <Badge bg={election.status === 'active' ? 'success' : 'warning'}>
                {election.status.toUpperCase()}
              </Badge>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {renderElectionStatus()}
          
          {/* Security Features */}
          <Alert variant="dark" className="mb-4">
            <Row className="align-items-center">
              <Col xs={1}>
                <FaLock size={24} />
              </Col>
              <Col xs={11}>
                <h6 className="mb-1">Secure Voting Process</h6>
                <p className="mb-0 small">
                  Your vote is encrypted and recorded on the blockchain. 
                  This ensures it cannot be altered, deleted, or viewed by unauthorized parties.
                </p>
              </Col>
            </Row>
          </Alert>
        </Card.Body>
      </Card>

      {/* Voting Instructions */}
      <Alert variant="info" className="mb-4">
        <FaVoteYea className="me-2" />
        <strong>Instructions:</strong> Select your preferred candidate below. 
        Once selected, review your choice and confirm. Your vote will be recorded on the blockchain.
      </Alert>

      {/* Candidates Selection */}
      <Row>
        <Col>
          <h4 className="mb-4">Select Your Candidate</h4>
        </Col>
      </Row>

      <Row className="g-4">
        {candidates.map((candidate) => (
          <Col key={candidate.id} xs={12} md={6} lg={4}>
            <CandidateCard
              candidate={candidate}
              isSelected={selectedCandidate === candidate.uuid}
              onSelect={() => handleCandidateSelect(candidate.uuid)}
            />
          </Col>
        ))}
      </Row>

      {/* Action Buttons */}
      <Row className="mt-5">
        <Col className="text-center">
          <Button
            variant="outline-secondary"
            className="me-3"
            onClick={() => navigate('/elections')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            variant="primary"
            size="lg"
            disabled={!selectedCandidate || isSubmitting}
            onClick={() => setShowConfirmModal(true)}
          >
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <FaVoteYea className="me-2" />
                Cast Your Vote
              </>
            )}
          </Button>
        </Col>
      </Row>

      {/* Blockchain Info */}
      {selectedCandidate && (
        <Row className="mt-5">
          <Col>
            <BlockchainVerification />
          </Col>
        </Row>
      )}

      {/* Confirmation Modal */}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaShieldAlt className="me-2" />
            Confirm Your Vote
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCandidate && (
            <>
              <Alert variant="warning" className="mb-4">
                <h6 className="mb-1">Important: Vote Cannot Be Changed</h6>
                <p className="mb-0">
                  Once you confirm, your vote will be permanently recorded on the blockchain 
                  and cannot be changed or undone.
                </p>
              </Alert>

              <Row className="mb-4">
                <Col md={4} className="text-center">
                  <div className="border rounded p-3">
                    <h6>Election</h6>
                    <p className="mb-0 fw-bold">{election.title}</p>
                  </div>
                </Col>
                <Col md={4} className="text-center">
                  <div className="border rounded p-3">
                    <h6>Selected Candidate</h6>
                    <p className="mb-0 fw-bold">
                      {candidates.find(c => c.uuid === selectedCandidate)?.name}
                    </p>
                    <small className="text-muted">
                      {candidates.find(c => c.uuid === selectedCandidate)?.partyAffiliation}
                    </small>
                  </div>
                </Col>
                <Col md={4} className="text-center">
                  <div className="border rounded p-3">
                    <h6>Voter</h6>
                    <p className="mb-0 fw-bold">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <small className="text-muted">{user?.governmentId}</small>
                  </div>
                </Col>
              </Row>

              <div className="border rounded p-3 bg-light">
                <h6 className="mb-3">Blockchain Verification</h6>
                <ul className="mb-0">
                  <li>Your vote will be encrypted with SHA-256</li>
                  <li>A unique transaction ID will be generated</li>
                  <li>Vote will be added to the next blockchain block</li>
                  <li>You can verify your vote anytime using the transaction ID</li>
                </ul>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleVoteSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Recording Vote...
              </>
            ) : (
              'Confirm and Cast Vote'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Vote Result Modal */}
      {voteResult && (
        <Modal
          show={!!voteResult}
          onHide={() => setVoteResult(null)}
          centered
          size="lg"
        >
          <Modal.Header closeButton className="bg-success text-white">
            <Modal.Title>
              <FaCheckCircle className="me-2" />
              Vote Successfully Recorded!
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="success">
              <h6>Your vote has been securely recorded on the blockchain.</h6>
            </Alert>

            <Row className="g-3">
              <Col md={6}>
                <Card>
                  <Card.Header>Vote Details</Card.Header>
                  <Card.Body>
                    <dl className="mb-0">
                      <dt>Vote ID</dt>
                      <dd className="font-monospace small">{voteResult.voteId}</dd>
                      
                      <dt>Transaction ID</dt>
                      <dd className="font-monospace small">{voteResult.transactionId}</dd>
                      
                      <dt>Vote Hash</dt>
                      <dd className="font-monospace small text-truncate">{voteResult.voteHash}</dd>
                      
                      <dt>Timestamp</dt>
                      <dd>{new Date(voteResult.timestamp).toLocaleString()}</dd>
                    </dl>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card>
                  <Card.Header>Verification</Card.Header>
                  <Card.Body>
                    <p className="mb-3">
                      You can verify your vote anytime using the following methods:
                    </p>
                    <ul className="mb-0">
                      <li>Check your voting history</li>
                      <li>Use the blockchain explorer with your Transaction ID</li>
                      <li>Contact election officials for verification</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              onClick={() => navigate('/votes/history')}
            >
              View Voting History
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => navigate('/blockchain')}
            >
              Open Blockchain Explorer
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};

export default Vote;