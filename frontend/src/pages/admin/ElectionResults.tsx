import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Form,
  Dropdown,
  Alert,
  Spinner,
  ProgressBar,
  Modal,
} from 'react-bootstrap';
import {
  FaChartBar,
  FaDownload,
  FaPrint,
  FaShare,
  FaEye,
  FaClock,
  FaUsers,
  FaVoteYea,
  FaPercentage,
  FaCog,
} from 'react-icons/fa';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';

// Hooks
import { useApi } from '@/hooks/useApi';
import { useWebSocket } from '@/hooks/useWebSocket';

// Types
import { Election, ElectionResultsNotification } from '@/types';

const ElectionResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const { isConnected } = useWebSocket();

  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [voterTurnout, setVoterTurnout] = useState({
    totalVoters: 0,
    voted: 0,
    percentage: 0,
  });
  const [timeStats, setTimeStats] = useState({
    startTime: '',
    endTime: '',
    duration: '',
    timeRemaining: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'table' | 'chart' | 'both'>('both');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');

  useEffect(() => {
    if (id) {
      fetchElectionResults();
    }
  }, [id]);

  useEffect(() => {
    const unsubscribe = onElectionUpdate((notification: ElectionResultsNotification) => {
      if (notification.electionId === id) {
        handleNewResults(notification);
      }
    });

    return unsubscribe;
  }, [id, onElectionUpdate]);

  const fetchElectionResults = async () => {
    try {
      setIsLoading(true);

      // Fetch election details
      const electionRes = await api.getElection(id!);
      if (electionRes.success && electionRes.data) {
        setElection(electionRes.data);
        
        // Calculate time stats
        const startDate = parseISO(electionRes.data.startDate);
        const endDate = parseISO(electionRes.data.endDate);
        const now = new Date();
        
        setTimeStats({
          startTime: format(startDate, 'PPpp'),
          endTime: format(endDate, 'PPpp'),
          duration: formatDistance(startDate, endDate),
          timeRemaining: now < endDate ? formatDistance(now, endDate) : 'Election ended',
        });
      } else {
        toast.error('Election not found');
        navigate('/admin');
        return;
      }

      // Fetch results
      const resultsRes = await api.getElectionResults(id!);
      if (resultsRes.success && resultsRes.data) {
        const resultsData = resultsRes.data.results || [];
        setResults(resultsData);

        // Calculate voter turnout
        const totalVotes = resultsData.reduce((sum: number, candidate: any) => sum + (candidate.vote_count || 0), 0);
        const totalVoters = 1000; // This should come from API
        const turnoutPercentage = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0;

        setVoterTurnout({
          totalVoters,
          voted: totalVotes,
          percentage: turnoutPercentage,
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching election results:', error);
      toast.error('Failed to load election results');
      setIsLoading(false);
    }
  };

  const handleNewResults = (notification: ElectionResultsNotification) => {
    setResults(notification.results || []);
    
    // Update voter turnout
    const totalVotes = notification.totalVotes || 0;
    const newTurnoutPercentage = voterTurnout.totalVoters > 0 ? 
      (totalVotes / voterTurnout.totalVoters) * 100 : 0;

    setVoterTurnout(prev => ({
      ...prev,
      voted: totalVotes,
      percentage: newTurnoutPercentage,
    }));

    toast.info(
      <div>
        <h6>Results Updated!</h6>
        <p>Election results have been updated with new votes.</p>
      </div>,
      { autoClose: 3000 }
    );
  };

  const formatDistance = (start: Date, end: Date) => {
    const diffMs = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} days ${diffHours} hours`;
    }
    return `${diffHours} hours`;
  };

  const calculateLeadingCandidate = () => {
    if (results.length === 0) return null;
    
    const leading = results.reduce((prev, current) => 
      (prev.vote_count > current.vote_count) ? prev : current
    );
    
    return leading;
  };

  const handleExport = () => {
    toast.info(`Exporting results as ${exportFormat.toUpperCase()}...`);
    // In production, this would trigger a download
    setShowExportModal(false);
  };

  const getElectionStatusBadge = () => {
    if (!election) return null;

    const now = new Date();
    const startDate = parseISO(election.startDate);
    const endDate = parseISO(election.endDate);

    if (now < startDate) {
      return <Badge bg="secondary">Upcoming</Badge>;
    } else if (now >= startDate && now <= endDate) {
      return <Badge bg="success">Live</Badge>;
    } else {
      return <Badge bg="warning">Completed</Badge>;
    }
  };

  const chartData = results.map((candidate, index) => ({
    name: candidate.candidate_name.length > 15 
      ? candidate.candidate_name.substring(0, 15) + '...'
      : candidate.candidate_name,
    votes: candidate.vote_count || 0,
    percentage: candidate.percentage || 0,
    color: `hsl(${index * 40}, 70%, 50%)`,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading election results...</p>
      </Container>
    );
  }

  if (!election) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Election not found or you don't have permission to view results.
        </Alert>
        <Button variant="primary" onClick={() => navigate('/admin')}>
          Back to Admin
        </Button>
      </Container>
    );
  }

  const leadingCandidate = calculateLeadingCandidate();

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <div className="d-flex align-items-center">
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/admin')}
              className="me-3"
            >
              ← Back
            </Button>
            <div>
              <h1 className="h3 mb-1">{election.title} Results</h1>
              <div className="d-flex align-items-center">
                {getElectionStatusBadge()}
                <span className="ms-2 text-muted">
                  <FaClock className="me-1" />
                  {timeStats.timeRemaining}
                </span>
              </div>
            </div>
          </div>
        </Col>
        <Col xs="auto">
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary">
              <FaCog className="me-2" />
              Actions
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setShowExportModal(true)}>
                <FaDownload className="me-2" />
                Export Results
              </Dropdown.Item>
              <Dropdown.Item onClick={() => toast.info('Print feature coming soon')}>
                <FaPrint className="me-2" />
                Print Results
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate(`/admin/elections/${id}/audit`)}>
                <FaEye className="me-2" />
                View Audit Trail
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="text-primary mb-2">
                <FaUsers size={24} />
              </div>
              <div className="display-6 mb-2">{voterTurnout.totalVoters.toLocaleString()}</div>
              <h6>Total Voters</h6>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="text-success mb-2">
                <FaVoteYea size={24} />
              </div>
              <div className="display-6 mb-2">{voterTurnout.voted.toLocaleString()}</div>
              <h6>Votes Cast</h6>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="text-info mb-2">
                <FaPercentage size={24} />
              </div>
              <div className="display-6 mb-2">{voterTurnout.percentage.toFixed(1)}%</div>
              <h6>Voter Turnout</h6>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="text-warning mb-2">
                <FaChartBar size={24} />
              </div>
              <div className="display-6 mb-2">{results.length}</div>
              <h6>Candidates</h6>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Voter Turnout Progress */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Voter Turnout Progress</h5>
        </Card.Header>
        <Card.Body>
          <Row className="align-items-center">
            <Col>
              <ProgressBar 
                now={voterTurnout.percentage} 
                label={`${voterTurnout.percentage.toFixed(1)}%`}
                variant={voterTurnout.percentage >= 50 ? 'success' : 'warning'}
                style={{ height: '30px' }}
              />
            </Col>
            <Col xs="auto">
              <div className="text-center">
                <div className="h4 mb-0">{voterTurnout.voted} / {voterTurnout.totalVoters}</div>
                <small className="text-muted">Votes Cast / Total Voters</small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Leading Candidate */}
      {leadingCandidate && (
        <Alert variant="success" className="mb-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h5 className="mb-1">
                <FaChartBar className="me-2" />
                Current Leader
              </h5>
              <p className="mb-0">
                <strong>{leadingCandidate.candidate_name}</strong> is leading with{' '}
                <strong>{leadingCandidate.vote_count}</strong> votes (
                {((leadingCandidate.vote_count / Math.max(voterTurnout.voted, 1)) * 100).toFixed(1)}%)
              </p>
            </Col>
            <Col md={4} className="text-md-end">
              <Badge bg="success" pill className="px-3 py-2">
                <span className="h5 mb-0">{leadingCandidate.vote_count}</span>
              </Badge>
            </Col>
          </Row>
        </Alert>
      )}

      {/* View Toggle */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Results Overview</h5>
            <div className="btn-group" role="group">
              <Button
                variant={selectedView === 'table' ? 'primary' : 'outline-primary'}
                onClick={() => setSelectedView('table')}
                size="sm"
              >
                Table View
              </Button>
              <Button
                variant={selectedView === 'chart' ? 'primary' : 'outline-primary'}
                onClick={() => setSelectedView('chart')}
                size="sm"
              >
                Chart View
              </Button>
              <Button
                variant={selectedView === 'both' ? 'primary' : 'outline-primary'}
                onClick={() => setSelectedView('both')}
                size="sm"
              >
                Both Views
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Results Display */}
      <Row className="g-4">
        {/* Table View */}
        {(selectedView === 'table' || selectedView === 'both') && (
          <Col lg={selectedView === 'both' ? 6 : 12}>
            <Card className="h-100">
              <Card.Header>
                <h5 className="mb-0">Detailed Results</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Candidate</th>
                        <th>Party</th>
                        <th className="text-end">Votes</th>
                        <th className="text-end">Percentage</th>
                        <th className="text-end">Lead</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results
                        .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
                        .map((candidate, index) => {
                          const voteCount = candidate.vote_count || 0;
                          const percentage = voterTurnout.voted > 0 
                            ? (voteCount / voterTurnout.voted) * 100 
                            : 0;
                          const isLeading = index === 0;

                          return (
                            <tr key={candidate.candidate_id} className={isLeading ? 'table-success' : ''}>
                              <td>
                                <Badge bg={isLeading ? 'success' : 'secondary'}>
                                  #{index + 1}
                                </Badge>
                              </td>
                              <td>
                                <strong>{candidate.candidate_name}</strong>
                              </td>
                              <td>
                                <Badge bg="light" text="dark">
                                  {candidate.party_affiliation || 'Independent'}
                                </Badge>
                              </td>
                              <td className="text-end">
                                <strong>{voteCount.toLocaleString()}</strong>
                              </td>
                              <td className="text-end">
                                <ProgressBar
                                  now={percentage}
                                  label={`${percentage.toFixed(1)}%`}
                                  variant={isLeading ? 'success' : 'primary'}
                                  style={{ height: '20px' }}
                                />
                              </td>
                              <td className="text-end">
                                {isLeading && results.length > 1 ? (
                                  <Badge bg="success">
                                    +{voteCount - (results[1]?.vote_count || 0)} votes
                                  </Badge>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* Chart View */}
        {(selectedView === 'chart' || selectedView === 'both') && (
          <Col lg={selectedView === 'both' ? 6 : 12}>
            <Card className="h-100">
              <Card.Header>
                <h5 className="mb-0">Visual Results</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col xs={12} className="mb-4">
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="votes" fill="#8884d8" name="Votes" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div style={{ height: '250px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="votes"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} votes`, 'Total']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Election Timeline */}
      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">Election Timeline</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="text-center">
              <div className="border rounded p-3">
                <h6>Start Time</h6>
                <p className="h5 mb-1">{timeStats.startTime}</p>
                <Badge bg="success">Started</Badge>
              </div>
            </Col>
            <Col md={4} className="text-center">
              <div className="border rounded p-3">
                <h6>Duration</h6>
                <p className="h5 mb-1">{timeStats.duration}</p>
                <Badge bg="info">Total Length</Badge>
              </div>
            </Col>
            <Col md={4} className="text-center">
              <div className="border rounded p-3">
                <h6>End Time</h6>
                <p className="h5 mb-1">{timeStats.endTime}</p>
                <Badge bg={timeStats.timeRemaining === 'Election ended' ? 'warning' : 'primary'}>
                  {timeStats.timeRemaining}
                </Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Export Modal */}
      <Modal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaDownload className="me-2" />
            Export Election Results
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Export Format</Form.Label>
              <div className="d-flex gap-2">
                <Button
                  variant={exportFormat === 'pdf' ? 'primary' : 'outline-primary'}
                  onClick={() => setExportFormat('pdf')}
                  className="flex-fill"
                >
                  PDF
                </Button>
                <Button
                  variant={exportFormat === 'csv' ? 'primary' : 'outline-primary'}
                  onClick={() => setExportFormat('csv')}
                  className="flex-fill"
                >
                  CSV
                </Button>
                <Button
                  variant={exportFormat === 'json' ? 'primary' : 'outline-primary'}
                  onClick={() => setExportFormat('json')}
                  className="flex-fill"
                >
                  JSON
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Include Data</Form.Label>
              <Form.Check
                type="checkbox"
                label="Candidate Details"
                defaultChecked
              />
              <Form.Check
                type="checkbox"
                label="Vote Counts"
                defaultChecked
              />
              <Form.Check
                type="checkbox"
                label="Timestamps"
                defaultChecked
              />
              <Form.Check
                type="checkbox"
                label="Voter Turnout Statistics"
                defaultChecked
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowExportModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
          >
            <FaDownload className="me-2" />
            Export Results
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ElectionResults;