import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Badge,
  Table,
  Alert,
  Spinner,
  Dropdown,
} from 'react-bootstrap';
import {
  FaUsers,
  FaVoteYea,
  FaClipboardCheck,
  FaChartBar,
  FaBell,
  FaExclamationTriangle,
  FaCog,
  FaSync,
  FaEye,
  FaDownload,
} from 'react-icons/fa';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// Components
import StatCard from '@/components/dashboard/StatCard';
import SystemHealth from '@/components/admin/SystemHealth';
import RecentActivity from '@/components/admin/RecentActivity';

// Hooks
import { useWebSocket } from '@/hooks/useWebSocket';
import { useApi } from '@/hooks/useApi';

// Types
import { Election, User, VoteNotification, BlockNotification } from '@/types';

const AdminDashboard: React.FC = () => {
  const api = useApi();
  const { isConnected, onVoteCast, onBlockMined } = useWebSocket();

  const [systemStats, setSystemStats] = useState({
    totalVoters: 0,
    pendingRegistrations: 0,
    activeElections: 0,
    totalVotes: 0,
    blockchainBlocks: 0,
    systemHealth: 100,
  });

  const [recentRegistrations, setRecentRegistrations] = useState<User[]>([]);
  const [recentVotes, setRecentVotes] = useState<any[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [voteTrends, setVoteTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const unsubscribeVote = onVoteCast((notification: VoteNotification) => {
      handleNewVote(notification);
    });

    const unsubscribeBlock = onBlockMined((notification: BlockNotification) => {
      handleNewBlock(notification);
    });

    return () => {
      unsubscribeVote();
      unsubscribeBlock();
    };
  }, [onVoteCast, onBlockMined]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch pending registrations
      const registrationsRes = await api.getPendingRegistrations();
      if (registrationsRes.success) {
        setRecentRegistrations(registrationsRes.data || []);
        setSystemStats(prev => ({
          ...prev,
          pendingRegistrations: registrationsRes.data?.length || 0,
        }));
      }

      // Fetch recent votes
      const votesRes = await api.getVotingHistory(1, 10);
      if (votesRes.success && votesRes.data) {
        setRecentVotes(votesRes.data.votes || []);
        setSystemStats(prev => ({
          ...prev,
          totalVotes: votesRes.data.pagination?.total || 0,
        }));
      }

      // Fetch elections
      const electionsRes = await api.getActiveElections();
      if (electionsRes.success) {
        setElections(electionsRes.data || []);
        setSystemStats(prev => ({
          ...prev,
          activeElections: electionsRes.data?.length || 0,
        }));
      }

      // Fetch blockchain stats
      const blockchainRes = await api.getBlockchainStats();
      if (blockchainRes.success && blockchainRes.data) {
        setSystemStats(prev => ({
          ...prev,
          blockchainBlocks: blockchainRes.data!.chainLength,
        }));
      }

      // Generate vote trends
      generateVoteTrends();

      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setIsLoading(false);
    }
  };

  const handleNewVote = (notification: VoteNotification) => {
    // Add to recent votes
    const newVote = {
      voteId: notification.voteId,
      electionId: notification.electionId,
      candidateId: notification.candidateId,
      timestamp: notification.timestamp,
    };

    setRecentVotes(prev => [newVote, ...prev.slice(0, 9)]);
    setSystemStats(prev => ({ ...prev, totalVotes: prev.totalVotes + 1 }));

    // Update vote trends
    updateVoteTrends();
  };

  const handleNewBlock = (notification: BlockNotification) => {
    setSystemStats(prev => ({
      ...prev,
      blockchainBlocks: notification.index,
    }));
  };

  const generateVoteTrends = () => {
    // Generate hourly vote data for last 24 hours
    const now = new Date();
    const data = [];
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now);
      hour.setHours(now.getHours() - i);
      
      data.push({
        hour: hour.getHours().toString().padStart(2, '0') + ':00',
        votes: Math.floor(Math.random() * 100) + 20, // Simulated data
      });
    }
    
    setVoteTrends(data);
  };

  const updateVoteTrends = () => {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0') + ':00';
    
    setVoteTrends(prev => {
      const newData = [...prev];
      const hourIndex = newData.findIndex(item => item.hour === currentHour);
      
      if (hourIndex !== -1) {
        newData[hourIndex].votes += 1;
      } else {
        newData.push({ hour: currentHour, votes: 1 });
        if (newData.length > 24) {
          newData.shift();
        }
      }
      
      return newData;
    });
  };

  const handleApproveRegistration = async (userId: string) => {
    try {
      const response = await api.updateUserStatus(userId, 'verified');
      if (response.success) {
        toast.success('Registration approved successfully');
        setRecentRegistrations(prev => prev.filter(user => user.id !== userId));
        setSystemStats(prev => ({
          ...prev,
          pendingRegistrations: prev.pendingRegistrations - 1,
          totalVoters: prev.totalVoters + 1,
        }));
      } else {
        toast.error(response.error || 'Failed to approve registration');
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      toast.error('Failed to approve registration');
    }
  };

  const handleRejectRegistration = async (userId: string) => {
    try {
      const response = await api.updateUserStatus(userId, 'rejected');
      if (response.success) {
        toast.success('Registration rejected successfully');
        setRecentRegistrations(prev => prev.filter(user => user.id !== userId));
        setSystemStats(prev => ({
          ...prev,
          pendingRegistrations: prev.pendingRegistrations - 1,
        }));
      } else {
        toast.error(response.error || 'Failed to reject registration');
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error('Failed to reject registration');
    }
  };

  const statCards = [
    {
      title: 'Total Voters',
      value: systemStats.totalVoters.toLocaleString(),
      icon: <FaUsers className="text-primary" />,
      change: '+5.2%',
      changeType: 'positive' as const,
      link: '/admin/pending-registrations',
    },
    {
      title: 'Pending Registrations',
      value: systemStats.pendingRegistrations,
      icon: <FaClipboardCheck className="text-warning" />,
      change: 'Need Review',
      changeType: (systemStats.pendingRegistrations > 0 ? 'negative' : 'positive') as 'positive' | 'negative' | 'neutral',
      link: '/admin/pending-registrations',
    },
    {
      title: 'Active Elections',
      value: systemStats.activeElections,
      icon: <FaVoteYea className="text-success" />,
      change: systemStats.activeElections > 0 ? 'Live' : 'None',
      changeType: (systemStats.activeElections > 0 ? 'positive' : 'neutral') as 'positive' | 'negative' | 'neutral',
      link: '/elections',
    },
    {
      title: 'Total Votes',
      value: systemStats.totalVotes.toLocaleString(),
      icon: <FaChartBar className="text-info" />,
      change: '+12.5%',
      changeType: 'positive' as const,
      link: '/votes/history',
    },
    {
      title: 'Blockchain Blocks',
      value: systemStats.blockchainBlocks,
      icon: <FaBell className="text-purple" />,
      change: '+3',
      changeType: 'positive' as const,
      link: '/blockchain',
    },
    {
      title: 'System Health',
      value: `${systemStats.systemHealth}%`,
      icon: systemStats.systemHealth > 90 ? (
        <FaChartBar className="text-success" />
      ) : (
        <FaExclamationTriangle className="text-danger" />
      ),
      change: systemStats.systemHealth > 90 ? 'Optimal' : 'Needs Attention',
      changeType: (systemStats.systemHealth > 90 ? 'positive' : 'negative') as 'positive' | 'negative' | 'neutral',
      link: '#',
    },
  ];

  const electionData = elections.map(election => ({
    name: election.title.length > 15 ? election.title.substring(0, 15) + '...' : election.title,
    votes: Math.floor(Math.random() * 1000) + 100, // Simulated data
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="h3 mb-2">Admin Dashboard</h1>
          <p className="text-muted mb-0">
            Monitor and manage the voting system in real-time
            <span className="ms-2">
              <Badge bg={isConnected ? 'success' : 'danger'}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </Badge>
            </span>
          </p>
        </Col>
        <Col xs="auto">
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary" id="dropdown-actions">
              <FaCog className="me-2" />
              Quick Actions
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={Link} to="/admin/pending-registrations">
                <FaClipboardCheck className="me-2" />
                Review Registrations
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/blockchain">
                <FaEye className="me-2" />
                View Blockchain
              </Dropdown.Item>
              <Dropdown.Item onClick={() => toast.info('Export feature coming soon')}>
                <FaDownload className="me-2" />
                Export Reports
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={fetchDashboardData} disabled={isLoading}>
                <FaSync className="me-2" />
                Refresh Data
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* Last Updated */}
      <Alert variant="light" className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <span>
            Last updated: <strong>{format(lastUpdated, 'PPpp')}</strong>
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner as="span" animation="border" size="sm" className="me-2" />
            ) : null}
            Refresh Now
          </Button>
        </div>
      </Alert>

      {/* Statistics Cards */}
      <Row className="g-3 mb-4">
        {statCards.map((stat, index) => (
          <Col key={index} xs={12} sm={6} lg={4} xl={2}>
            <StatCard {...stat} />
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row className="mb-4">
        {/* Vote Trends */}
        <Col xl={8} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Vote Activity (Last 24 Hours)</h5>
              <Badge bg="primary">{systemStats.totalVotes.toLocaleString()} total votes</Badge>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={voteTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="votes"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Votes per Hour"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Election Distribution */}
        <Col xl={4} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Election Vote Distribution</h5>
            </Card.Header>
            <Card.Body>
              {electionData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={electionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="votes"
                      >
                        {electionData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} votes`, 'Total']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3">
                    <Table borderless size="sm">
                      <thead>
                        <tr>
                          <th>Election</th>
                          <th className="text-end">Votes</th>
                          <th className="text-end">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {electionData.map((election, index) => (
                          <tr key={index}>
                            <td>{election.name}</td>
                            <td className="text-end">{election.votes}</td>
                            <td className="text-end">
                              {((election.votes / electionData.reduce((a, b) => a + b.votes, 0)) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">No active elections</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* System Health */}
      <Row className="mb-4">
        <Col>
          <SystemHealth />
        </Col>
      </Row>

      {/* Recent Activity & Pending Registrations */}
      <Row className="g-4">
        {/* Pending Registrations */}
        <Col lg={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Pending Voter Registrations</h5>
              <Badge bg="warning" pill>
                {systemStats.pendingRegistrations}
              </Badge>
            </Card.Header>
            <Card.Body>
              {recentRegistrations.length > 0 ? (
                <div className="table-responsive">
                  <Table hover size="sm">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Government ID</th>
                        <th>Registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRegistrations.slice(0, 5).map((user) => (
                        <tr key={user.id}>
                          <td>
                            {user.firstName} {user.lastName}
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <code>{user.governmentId}</code>
                          </td>
                          <td>{format(new Date(user.createdAt), 'MMM d')}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleApproveRegistration(user.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRejectRegistration(user.id)}
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="success" className="text-center mb-0">
                  <FaClipboardCheck className="me-2" />
                  All registrations have been processed
                </Alert>
              )}
              
              {recentRegistrations.length > 5 && (
                <div className="text-center mt-3">
                  <Link to="/admin/pending-registrations" className="btn btn-outline-primary btn-sm">
                    View All ({recentRegistrations.length})
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col lg={6}>
          <RecentActivity activities={recentVotes} />
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row className="mt-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <div className="display-6 text-primary mb-2">
                {systemStats.pendingRegistrations}
              </div>
              <h6>Pending Approvals</h6>
              <p className="text-muted small mb-0">
                Voter registrations awaiting review
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <div className="display-6 text-success mb-2">
                {systemStats.totalVotes}
              </div>
              <h6>Votes Today</h6>
              <p className="text-muted small mb-0">
                Total votes cast in last 24 hours
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <div className="display-6 text-info mb-2">
                {systemStats.blockchainBlocks}
              </div>
              <h6>Blockchain Blocks</h6>
              <p className="text-muted small mb-0">
                Total blocks in voting chain
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
