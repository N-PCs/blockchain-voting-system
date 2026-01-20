import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { FaUser, FaIdCard, FaEnvelope, FaCalendar } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex align-items-center">
                <FaUser className="me-2" />
                <h4 className="mb-0">User Profile</h4>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                  <FaUser size={40} className="text-secondary" />
                </div>
                <h5 className="mt-3">{user.firstName} {user.lastName}</h5>
                <Badge bg={getStatusBadgeVariant(user.registrationStatus)} className="text-capitalize">
                  {user.registrationStatus}
                </Badge>
              </div>

              <div className="profile-info">
                <div className="info-item mb-3 d-flex align-items-center">
                  <FaEnvelope className="text-primary me-3" />
                  <div>
                    <strong>Email:</strong><br />
                    {user.email}
                  </div>
                </div>

                <div className="info-item mb-3 d-flex align-items-center">
                  <FaIdCard className="text-primary me-3" />
                  <div>
                    <strong>Government ID:</strong><br />
                    {user.registrationStatus === 'verified' ? user.governmentId : '••••••••'}
                  </div>
                </div>

                <div className="info-item mb-3 d-flex align-items-center">
                  <FaCalendar className="text-primary me-3" />
                  <div>
                    <strong>User Type:</strong><br />
                    <span className="text-capitalize">{user.userType}</span>
                  </div>
                </div>

                <div className="info-item mb-3 d-flex align-items-center">
                  <FaCalendar className="text-primary me-3" />
                  <div>
                    <strong>Account Status:</strong><br />
                    <span className={`text-capitalize ${
                      user.isActive ? 'text-success' : 'text-danger'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {user.registrationStatus === 'pending' && (
                <div className="alert alert-warning mt-4">
                  <strong>Registration Pending:</strong> Your account is waiting for admin approval.
                  You will be able to vote once your registration is verified.
                </div>
              )}

              {user.registrationStatus === 'rejected' && (
                <div className="alert alert-danger mt-4">
                  <strong>Registration Rejected:</strong> Please contact support for assistance.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;