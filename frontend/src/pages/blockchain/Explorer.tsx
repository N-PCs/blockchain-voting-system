import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Form,
  InputGroup,
  Spinner,
  Alert,
  Pagination,
} from 'react-bootstrap';
import {
  FaSearch,
  FaCube,
  FaExchangeAlt,
  FaChartLine,
  FaLink,
  FaCheckCircle,
  FaClock,
  FaFire,
  FaLock,
} from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';

// Components
import BlockCard from '@/components/blockchain/BlockCard';
import TransactionList from '@/components/blockchain/TransactionList';

// Hooks
import { useWebSocket } from '@/hooks/useWebSocket';
import { useApi } from '@/hooks/useApi';

// Types
import { Block, BlockchainStats, BlockNotification } from '@/types';

const BlockchainExplorer: React.FC = () => {
  const api = useApi();
  const { isConnected, notifications, onBlockMined } = useWebSocket();

  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'block' | 'transaction'>('block');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [blocksPerPage] = useState(10);

  useEffect(() => {
    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [currentPage]);

  useEffect(() => {
    const unsubscribe = onBlockMined((notification: BlockNotification) => {
      handleNewBlock(notification);
    });

    return unsubscribe;
  }, [onBlockMined]);

  const fetchBlockchainData = async () => {
    try {
      setIsLoading(true);

      // Fetch blockchain stats
      const statsRes = await api.getBlockchainStats();
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      // Fetch blocks with pagination
      const blocksRes = await api.getBlocks(currentPage, blocksPerPage);
      if (blocksRes.success && blocksRes.data) {
        setBlocks(blocksRes.data.blocks || []);
        setTotalPages(blocksRes.data.pagination?.totalPages || 1);
        
        // Extract recent transactions from latest block
        if (blocksRes.data.blocks.length > 0) {
          const latestBlock = blocksRes.data.blocks[0];
          const voteTransactions = latestBlock.transactions
            .filter((tx: any) => tx.type === 'vote')
            .slice(0, 5);
          setRecentTransactions(voteTransactions);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      toast.error('Failed to load blockchain data');
      setIsLoading(false);
    }
  };

  const handleNewBlock = (notification: BlockNotification) => {
    // Refresh data when new block is mined
    fetchBlockchainData();
    
    // Show notification
    toast.success(
      <div>
        <h6>New Block Mined!</h6>
        <p>Block #{notification.index} added to chain</p>
        <small>Contains {notification.transactionCount} transactions</small>
      </div>,
      { autoClose: 5000 }
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      fetchBlockchainData();
      return;
    }

    setIsLoading(true);
    
    try {
      if (searchType === 'block') {
        const blockIndex = parseInt(searchTerm);
        if (!isNaN(blockIndex)) {
          const blockRes = await api.getBlock(blockIndex);
          if (blockRes.success && blockRes.data) {
            setBlocks([blockRes.data]);
            setTotalPages(1);
          } else {
            toast.error('Block not found');
            fetchBlockchainData();
          }
        } else {
          toast.error('Please enter a valid block number');
        }
      } else {
        const txRes = await api.getTransaction(searchTerm);
        if (txRes.success && txRes.data) {
          // For transaction search, we need to find which block it's in
          // For now, just show a message
          toast.info(
            <div>
              <h6>Transaction Found</h6>
              <p>Transaction ID: {txRes.data.transactionId}</p>
              <Link to={`/blockchain/transactions/${searchTerm}`} className="btn btn-sm btn-primary">
                View Details
              </Link>
            </div>,
            { autoClose: 10000 }
          );
        } else {
          toast.error('Transaction not found');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const generateChainData = () => {
    if (!stats) return [];
    
    return blocks.slice(0, 10).map(block => ({
      name: `Block ${block.index}`,
      transactions: block.transactionCount,
      difficulty: block.nonce,
    }));
  };

  const renderStatsCards = () => {
    if (!stats) return null;

    const statItems = [
      {
        title: 'Chain Length',
        value: stats.chainLength,
        icon: <FaLink className="text-primary" />,
        color: 'primary',
      },
      {
        title: 'Pending Transactions',
        value: stats.pendingTransactions,
        icon: <FaClock className="text-warning" />,
        color: 'warning',
      },
      {
        title: 'Total Transactions',
        value: stats.totalTransactions,
        icon: <FaExchangeAlt className="text-success" />,
        color: 'success',
      },
      {
        title: 'Vote Transactions',
        value: stats.voteTransactions,
        icon: <FaCheckCircle className="text-info" />,
        color: 'info',
      },
      {
        title: 'Difficulty',
        value: stats.difficulty,
        icon: <FaFire className="text-danger" />,
        color: 'danger',
      },
      {
        title: 'Chain Status',
        value: stats.isValid ? 'Valid' : 'Invalid',
        icon: stats.isValid ? (
          <FaCheckCircle className="text-success" />
        ) : (
          <FaClock className="text-danger" />
        ),
        color: stats.isValid ? 'success' : 'danger',
      },
    ];

    return (
      <Row className="g-3 mb-4">
        {statItems.map((stat, index) => (
          <Col key={index} xs={6} md={4} lg={2}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <div className={`text-${stat.color} mb-2`} style={{ fontSize: '1.5rem' }}>
                  {stat.icon}
                </div>
                <h4 className="mb-1">{stat.value.toLocaleString()}</h4>
                <p className="text-muted mb-0 small">{stat.title}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-6">
            <FaCube className="me-2" />
            Blockchain Explorer
          </h1>
          <p className="text-muted">
            Real-time exploration of the voting blockchain. Monitor transactions, blocks, and chain statistics.
          </p>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          <Badge bg={isConnected ? 'success' : 'danger'} className="me-2">
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </Badge>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={fetchBlockchainData}
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner as="span" animation="border" size="sm" />
            ) : (
              'Refresh'
            )}
          </Button>
        </Col>
      </Row>

      {/* Search */}
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="align-items-center">
              <Col md={4} className="mb-2">
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder={
                      searchType === 'block'
                        ? 'Enter block number...'
                        : 'Enter transaction ID...'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={3} className="mb-2">
                <Form.Select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                >
                  <option value="block">Search by Block</option>
                  <option value="transaction">Search by Transaction</option>
                </Form.Select>
              </Col>
              <Col md={3} className="mb-2">
                <Button type="submit" variant="primary" className="w-100" disabled={isLoading}>
                  {isLoading ? (
                    <Spinner as="span" animation="border" size="sm" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </Col>
              <Col md={2} className="mb-2">
                <Button
                  variant="outline-secondary"
                  className="w-100"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                    fetchBlockchainData();
                  }}
                  disabled={isLoading}
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Statistics */}
      {renderStatsCards()}

      {/* Charts */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Recent Blocks Analysis
              </h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={generateChainData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="transactions" fill="#8884d8" name="Transactions" />
                  <Bar yAxisId="right" dataKey="difficulty" fill="#82ca9d" name="Difficulty" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Chain Health</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column">
              {stats && (
                <>
                  <div className="text-center mb-4">
                    <div
                      className="display-4 fw-bold mb-2"
                      style={{
                        color: stats.isValid ? '#28a745' : '#dc3545',
                      }}
                    >
                      {stats.isValid ? '✓' : '✗'}
                    </div>
                    <h5 className={stats.isValid ? 'text-success' : 'text-danger'}>
                      {stats.isValid ? 'Chain Valid' : 'Chain Invalid'}
                    </h5>
                  </div>
                  
                  <div className="mt-auto">
                    <Table borderless size="sm">
                      <tbody>
                        <tr>
                          <td>Latest Block</td>
                          <td className="text-end">
                            <Link to={`/blockchain/blocks/${stats.latestBlockIndex}`}>
                              #{stats.latestBlockIndex}
                            </Link>
                          </td>
                        </tr>
                        <tr>
                          <td>Mining Reward</td>
                          <td className="text-end">{stats.miningReward} tokens</td>
                        </tr>
                        <tr>
                          <td>Last Updated</td>
                          <td className="text-end">{new Date().toLocaleTimeString()}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Blocks */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Blocks</h5>
              <small className="text-muted">
                Showing {blocks.length} of {stats?.chainLength || 0} blocks
              </small>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading blocks...</p>
                </div>
              ) : blocks.length > 0 ? (
                <div className="blocks-list">
                  {blocks.map((block) => (
                    <BlockCard key={block.index} block={block} />
                  ))}
                </div>
              ) : (
                <Alert variant="info" className="text-center">
                  No blocks found
                </Alert>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.First
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === currentPage}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Pagination.Item>
                      );
                    })}
                    
                    <Pagination.Next
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Transactions */}
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Recent Vote Transactions</h5>
            </Card.Header>
            <Card.Body>
              {recentTransactions.length > 0 ? (
                <TransactionList transactions={recentTransactions} />
              ) : (
                <Alert variant="info" className="text-center">
                  No recent vote transactions
                </Alert>
              )}
              
              <div className="mt-4">
                <h6 className="mb-3">Blockchain Information</h6>
                <ul className="list-unstyled small">
                  <li className="mb-2">
                    <FaCube className="me-2 text-primary" />
                    Each block contains multiple vote transactions
                  </li>
                  <li className="mb-2">
                    <FaExchangeAlt className="me-2 text-success" />
                    Transactions are verified before adding to blocks
                  </li>
                  <li className="mb-2">
                    <FaLock className="me-2 text-warning" />
                    SHA-256 encryption ensures vote security
                  </li>
                  <li className="mb-2">
                    <FaLink className="me-2 text-info" />
                    Blocks are cryptographically linked together
                  </li>
                  <li>
                    <FaCheckCircle className="me-2 text-success" />
                    Chain validation ensures data integrity
                  </li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Mining Information */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Mining Process</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3} className="text-center mb-3">
              <div className="border rounded p-3">
                <div className="display-6 text-primary">1</div>
                <h6>Vote Collection</h6>
                <p className="small mb-0">Votes are collected and verified</p>
              </div>
            </Col>
            <Col md={3} className="text-center mb-3">
              <div className="border rounded p-3">
                <div className="display-6 text-primary">2</div>
                <h6>Transaction Pool</h6>
                <p className="small mb-0">Verified votes enter pending pool</p>
              </div>
            </Col>
            <Col md={3} className="text-center mb-3">
              <div className="border rounded p-3">
                <div className="display-6 text-primary">3</div>
                <h6>Proof of Work</h6>
                <p className="small mb-0">Miners solve cryptographic puzzle</p>
              </div>
            </Col>
            <Col md={3} className="text-center mb-3">
              <div className="border rounded p-3">
                <div className="display-6 text-primary">4</div>
                <h6>Block Creation</h6>
                <p className="small mb-0">New block added to chain</p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BlockchainExplorer;