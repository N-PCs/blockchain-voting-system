import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Form,
  InputGroup,
  Modal,
  Alert,
  Spinner,
  Pagination,
} from 'react-bootstrap';
import {
  FaSearch,
  FaUserCheck,
  FaUserTimes,
  FaEye,
  FaFilter,
  FaDownload,
  FaEnvelope,
  FaIdCard,
  FaCalendar,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { format, parseISO, differenceInYears } from 'date-fns';

// Hooks
import { useApi } from '@/hooks/useApi';

// Types
import { User } from '@/types';

const PendingRegistrations: React.FC = () => {
  const navigate = useNavigate();
  const api = useApi();

  const [registrations, setRegistrations] = useState<User[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchRegistrations();
  }, [currentPage, filterStatus]);

  useEffect(() => {
    filterRegistrations();
  }, [searchTerm, registrations]);

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPendingRegistrations();
      
      if (response.success) {
        const allRegistrations = response.data || [];
        
        // Filter based on status
        let filtered = allRegistrations;
        if (filterStatus === 'pending') {
          filtered = allRegistrations.filter(user => user.registrationStatus === 'pending');
        }
        
        setRegistrations(filtered);
        setFilteredRegistrations(filtered);
        setTotalItems(filtered.length);
      } else {
        toast.error(response.error || 'Failed to load registrations');
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRegistrations = () => {
    if (!searchTerm.trim()) {
      setFilteredRegistrations(registrations);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = registrations.filter(user =>
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.governmentId.toLowerCase().includes(searchLower)
    );

    setFilteredRegistrations(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  };

  const handleApprove = async () => {
    if (!selectedUser) return;

    try {
      const response = await api.updateUserStatus(selectedUser.id, 'verified');
      
      if (response.success) {
        toast.success(`Registration approved for ${selectedUser.firstName} ${selectedUser.lastName}`);
        
        // Update local state
        setRegistrations(prev => prev.filter(user => user.id !== selectedUser.id));
        setFilteredRegistrations(prev => prev.filter(user => user.id !== selectedUser.id));
        
        // Close modals
        setShowApproveModal(false);
        setShowDetailModal(false);
        setSelectedUser(null);
      } else {
        toast.error(response.error || 'Failed to approve registration');
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      toast.error('Failed to approve registration');
    }
  };

  const handleReject = async (reason?: string) => {
    if (!selectedUser) return;

    try {
      const response = await api.updateUserStatus(selectedUser.id, 'rejected');
      
      if (response.success) {
        toast.success(`Registration rejected for ${selectedUser.firstName} ${selectedUser.lastName}`);
        
        // Update local state
        setRegistrations(prev => prev.filter(user => user.id !== selectedUser.id));
        setFilteredRegistrations(prev => prev.filter(user => user.id !== selectedUser.id));
        
        // Close modals
        setShowRejectModal(false);
        setShowDetailModal(false);
        setSelectedUser(null);
      } else {
        toast.error(response.error || 'Failed to reject registration');
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error('Failed to reject registration');
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const calculateAge = (dateOfBirth: string) => {
    try {
      return differenceInYears(new Date(), parseISO(dateOfBirth));
    } catch {
      return 'Unknown';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Pending Review</Badge>;
      case 'verified':
        return <Badge bg="success">Verified</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const paginatedItems = filteredRegistrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="h3 mb-2">Voter Registrations</h1>
          <p className="text-muted">
            Review and approve voter registration applications
          </p>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          <Button
            variant="outline-primary"
            onClick={fetchRegistrations}
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

      {/* Stats */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="display-6 text-primary mb-2">
                {registrations.length}
              </div>
              <h6>Total Registrations</h6>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="display-6 text-warning mb-2">
                {registrations.filter(u => u.registrationStatus === 'pending').length}
              </div>
              <h6>Pending Review</h6>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="display-6 text-success mb-2">
                {registrations.filter(u => u.registrationStatus === 'verified').length}
              </div>
              <h6>Verified Voters</h6>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <div className="display-6 text-danger mb-2">
                {registrations.filter(u => u.registrationStatus === 'rejected').length}
              </div>
              <h6>Rejected</h6>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4} className="mb-2">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3} className="mb-2">
              <InputGroup>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                  <option value="pending">Pending Only</option>
                  <option value="all">All Registrations</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3} className="mb-2">
              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('pending');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Col>
            <Col md={2} className="mb-2 text-end">
              <Button
                variant="outline-primary"
                onClick={() => toast.info('Export feature coming soon')}
              >
                <FaDownload className="me-2" />
                Export
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Registrations Table */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            Registration Applications ({totalItems} total)
          </h5>
          <Badge bg="light" text="dark">
            Page {currentPage} of {totalPages}
          </Badge>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading registrations...</p>
            </div>
          ) : paginatedItems.length > 0 ? (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Government ID</th>
                      <th>Age</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <strong>
                            {user.firstName} {user.lastName}
                          </strong>
                        </td>
                        <td>
                          <a href={`mailto:${user.email}`}>
                            {user.email}
                          </a>
                        </td>
                        <td>
                          <code>{user.governmentId}</code>
                        </td>
                        <td>{calculateAge(user.dateOfBirth)} years</td>
                        <td>{getStatusBadge(user.registrationStatus)}</td>
                        <td>{format(parseISO(user.createdAt), 'MMM d, yyyy')}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleViewDetails(user)}
                            >
                              <FaEye />
                            </Button>
                            {user.registrationStatus === 'pending' && (
                              <>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowApproveModal(true);
                                  }}
                                >
                                  <FaUserCheck />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowRejectModal(true);
                                  }}
                                >
                                  <FaUserTimes />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.First
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Pagination.Item>
                      );
                    })}
                    
                    <Pagination.Next
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <Alert variant="info" className="text-center">
              <FaUserCheck className="me-2" />
              No pending registrations found
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => {
          setShowDetailModal(false);
          setSelectedUser(null);
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Registration Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Row>
              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>Personal Information</Card.Header>
                  <Card.Body>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Full Name</dt>
                      <dd className="col-sm-8">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </dd>

                      <dt className="col-sm-4">Email</dt>
                      <dd className="col-sm-8">
                        <a href={`mailto:${selectedUser.email}`}>
                          {selectedUser.email}
                        </a>
                      </dd>

                      <dt className="col-sm-4">Date of Birth</dt>
                      <dd className="col-sm-8">
                        {format(parseISO(selectedUser.dateOfBirth), 'PP')}
                        <span className="ms-2 text-muted">
                          ({calculateAge(selectedUser.dateOfBirth)} years old)
                        </span>
                      </dd>

                      <dt className="col-sm-4">Government ID</dt>
                      <dd className="col-sm-8">
                        <code>{selectedUser.governmentId}</code>
                      </dd>
                    </dl>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header>Registration Status</Card.Header>
                  <Card.Body>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Status</dt>
                      <dd className="col-sm-8">
                        {getStatusBadge(selectedUser.registrationStatus)}
                      </dd>

                      <dt className="col-sm-4">User Type</dt>
                      <dd className="col-sm-8">
                        <Badge bg="info">{selectedUser.userType}</Badge>
                      </dd>

                      <dt className="col-sm-4">Registered On</dt>
                      <dd className="col-sm-8">
                        {format(parseISO(selectedUser.createdAt), 'PPpp')}
                      </dd>

                      <dt className="col-sm-4">Last Updated</dt>
                      <dd className="col-sm-8">
                        {format(parseISO(selectedUser.updatedAt), 'PPpp')}
                      </dd>
                    </dl>
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={12}>
                <Card>
                  <Card.Header>Verification</Card.Header>
                  <Card.Body>
                    <p className="mb-3">
                      Verify the information above matches the government-issued identification.
                    </p>
                    <div className="d-flex gap-2">
                      <Button
                        variant="success"
                        onClick={() => {
                          setShowApproveModal(true);
                          setShowDetailModal(false);
                        }}
                      >
                        <FaUserCheck className="me-2" />
                        Approve Registration
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          setShowRejectModal(true);
                          setShowDetailModal(false);
                        }}
                      >
                        <FaUserTimes className="me-2" />
                        Reject Registration
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      {/* Approve Modal */}
      <Modal
        show={showApproveModal}
        onHide={() => setShowApproveModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FaUserCheck className="me-2" />
            Approve Registration
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <Alert variant="success">
                <h6>Confirm Approval</h6>
                <p className="mb-0">
                  Are you sure you want to approve the registration for{' '}
                  <strong>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </strong>?
                </p>
              </Alert>

              <div className="border rounded p-3 mb-3">
                <h6>Registration Details</h6>
                <ul className="mb-0">
                  <li>Name: {selectedUser.firstName} {selectedUser.lastName}</li>
                  <li>Email: {selectedUser.email}</li>
                  <li>Government ID: {selectedUser.governmentId}</li>
                  <li>Age: {calculateAge(selectedUser.dateOfBirth)} years</li>
                </ul>
              </div>

              <p className="text-muted small mb-0">
                Once approved, this user will be able to vote in all active elections.
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowApproveModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleApprove}
          >
            <FaUserCheck className="me-2" />
            Approve Registration
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal
        show={showRejectModal}
        onHide={() => setShowRejectModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FaUserTimes className="me-2" />
            Reject Registration
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <Alert variant="danger">
                <h6>Confirm Rejection</h6>
                <p className="mb-0">
                  Are you sure you want to reject the registration for{' '}
                  <strong>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </strong>?
                </p>
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Reason for Rejection (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter reason for rejection..."
                />
              </Form.Group>

              <p className="text-muted small mb-0">
                The user will be notified and will need to re-register with corrected information.
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowRejectModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleReject()}
          >
            <FaUserTimes className="me-2" />
            Reject Registration
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PendingRegistrations;