import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Alert, Badge, Button } from 'react-bootstrap';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  FaVoteYea, 
  FaUsers, 
  FaCube, 
  FaChartLine,
  FaBell,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';

// Components
import StatCard from '@/components/dashboard/StatCard';
import RecentVotes from '@/components/dashboard/RecentVotes';
import BlockchainStatus from '@/components/dashboard/BlockchainStatus';
import ElectionWidget from '@/components/dashboard/ElectionWidget';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useApi } from '@/hooks/useApi';

// Types
import { Election, VoteNotification, BlockNotification } from '@/types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { isConnected, notifications } = useWebSocket();
  const api = useApi();

  const [stats, setStats] = useState({
    totalVotes: 0,
    activeElections: 0,
    blockchainBlocks: 0,
    pendingRegistrations: 0,
  });

  const [recentVotes, setRecentVotes] = useState<any[]>([]);
  const [activeElections, setActiveElections] = useState<Election[]>([]);
  const [blockchainStats, setBlockchainStats] = useState<any>(null);
  const [voteChartData, setVoteChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const unsubscribeVote = api.websocket.onVoteCast((notification) => {
      handleNewVote(notification);
    });

    const unsubscribeBlock = api.websocket.onBlockMined((notification) => {
      handleNewBlock(notification);
    });

    return () => {
      unsubscribeVote();
      unsubscribeBlock();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch active elections
      const electionsRes = await api.getActiveElections();
      if (electionsRes.success) {
        setActiveElections(electionsRes.data || []);
      }

      // Fetch blockchain stats
      const blockchainRes = await api.getBlockchainStats();
      if (blockchainRes.success && blockchainRes.data) {
        setBlockchainStats(blockchainRes.data);
        setStats(prev => ({
          ...prev,
          blockchainBlocks: blockchainRes.data.chainLength,
        }));
      }

      // Fetch recent votes (last 10)
      const votesRes = await api.getVotingHistory(1, 10);
      if (votesRes.success && votesRes.data) {
        setRecentVotes(votesRes.data.votes || []);
        setStats(prev => ({
          ...prev,
          totalVotes: votesRes.data.pagination?.total || 0,
        }));
      }

      // Generate chart data
      generateChartData();

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    setStats(prev => ({ ...prev, totalVotes: prev.totalVotes + 1 }));

    // Update chart data
    updateVoteChart(notification);

    // Show notification
    toast.info(`New vote cast in election ${notification.electionId}`, {
      icon: <FaVoteYea />,
    });
  };

  const handleNewBlock = (notification: BlockNotification) => {
    setStats(prev => ({
      ...prev,
      blockchainBlocks: notification.index,
    }));

    toast.success(`New block mined: #${notification.index}`, {
      icon: <FaCube />,
    });
  };

  const generateChartData = () => {
    // Simulate vote data by hour for the last 24 hours
    const now = new Date();
    const data = [];
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now);
      hour.setHours(now.getHours() - i);
      
      data.push({
        hour: hour.getHours().toString().padStart(2, '0') + ':00',
        votes: Math.floor(Math.random() * 50) + 10, // Random data for demo
      });
    }
    
    setVoteChartData(data);
  };

  const updateVoteChart = (notification: VoteNotification) => {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0') + ':00';
    
    setVoteChartData(prev => {
      const newData = [...prev];
      const hourIndex = newData.findIndex(item => item.hour === currentHour);
      
      if (hourIndex !== -1) {
        newData[hourIndex].votes += 1;
      } else {
        // Add new hour if not exists
        newData.push({ hour: currentHour, votes: 1 });
        // Keep only last 24 hours
        if (newData.length > 24) {
          newData.shift();
        }
      }
      
      return newData;
    });
  };

  const statCards = [
    {
      title: 'Total Votes',
      value: stats.totalVotes.toLocaleString(),
      icon: <FaVoteYea className="text-primary" />,
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Elections',
      value: activeElections.length,
      icon: <FaChartLine className="text-success" />,
      change: activeElections.length > 0 ? 'Live' : 'None',
      changeType: activeElections.length > 0 ? 'positive' : 'neutral',
    },
    {
      title: 'Blockchain Blocks',
      value: stats.blockchainBlocks,
      icon: <FaCube className="text-warning" />,
      change: '+3',
      changeType: 'positive',
    },
    {
      title: 'WebSocket',
      value: isConnected ? 'Connected' : 'Disconnected',
      icon: isConnected ? (
        <FaBell className="text-success" />
      ) : (
        <FaExclamationTriangle className="text-danger" />
      ),
      change: isConnected ? 'Live' : 'Offline',
      changeType: isConnected ? 'positive' : 'negative',
    },
  ];

  const electionData = activeElections.map(election => ({
    name: election.title,
    value: Math.floor(Math.random() * 1000) + 100, // Random votes for demo
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <Alert variant="info" className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="alert-heading">
              Welcome back, {user?.firstName} {user?.lastName}!
            </h4>
            <p className="mb-0">
              {user?.userType === 'admin' 
                ? 'You have admin privileges. Manage the voting system from here.'
                : 'You are registered as a voter. Check active elections below.'}
            </p>
          </div>
          <Badge bg={isConnected ? 'success' : 'danger'}>
            {isConnected ? 'LIVE UPDATES' : 'OFFLINE'}
          </Badge>
        </div>
      </Alert>

      {/* Statistics Cards */}
      <Row className="mb-4">
        {statCards.map((stat, index) => (
          <Col key={index} xs={12} sm={6} lg={3} className="mb-3">
            <StatCard {...stat} />
          </Col>
        ))}
      </Row>

      {/* Charts and Data */}
      <Row>
        {/* Vote Activity Chart */}
        <Col lg={8} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Vote Activity (Last 24 Hours)</h5>
              <Button variant="outline-primary" size="sm" onClick={fetchDashboardData}>
                Refresh
              </Button>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={voteChartData}>
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
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Election Distribution */}
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Election Distribution</h5>
            </Card.Header>
            <Card.Body>
              {electionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={electionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {electionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} votes`, 'Total']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">No active elections</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row>
        {/* Recent Votes */}
        <Col lg={6} className="mb-4">
          <RecentVotes votes={recentVotes} />
        </Col>

        {/* Active Elections */}
        <Col lg={6} className="mb-4">
          <ElectionWidget elections={activeElections} />
        </Col>
      </Row>

      {/* Blockchain Status */}
      <Row>
        <Col xs={12}>
          <BlockchainStatus stats={blockchainStats} />
        </Col>
      </Row>

      {/* Quick Actions for Admin */}
      {user?.userType === 'admin' && (
        <Card className="mt-4">
          <Card.Header>
            <h5 className="mb-0">Quick Admin Actions</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3} className="mb-2">
                <Button
                  variant="outline-primary"
                  className="w-100"
                  href="/admin/pending-registrations"
                >
                  Review Registrations
                </Button>
              </Col>
              <Col md={3} className="mb-2">
                <Button
                  variant="outline-success"
                  className="w-100"
                  href="/blockchain"
                >
                  Blockchain Explorer
                </Button>
              </Col>
              <Col md={3} className="mb-2">
                <Button
                  variant="outline-warning"
                  className="w-100"
                  onClick={() => toast.info('Feature coming soon!')}
                >
                  Generate Reports
                </Button>
              </Col>
              <Col md={3} className="mb-2">
                <Button
                  variant="outline-danger"
                  className="w-100"
                  onClick={() => toast.info('Feature coming soon!')}
                >
                  System Settings
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;