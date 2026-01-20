import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { FaUserPlus, FaVoteYea, FaUserCheck, FaCube } from 'react-icons/fa';

interface RecentActivityProps {
  activities?: any[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  // Mock activities for demo
  const mockActivities = [
    {
      id: 1,
      type: 'user_registered',
      message: 'New user registered: john.doe@example.com',
      time: '2 minutes ago',
      icon: <FaUserPlus className="text-success" />,
    },
    {
      id: 2,
      type: 'vote_cast',
      message: 'Vote cast in Election #123',
      time: '5 minutes ago',
      icon: <FaVoteYea className="text-primary" />,
    },
    {
      id: 3,
      type: 'user_verified',
      message: 'User verification completed',
      time: '10 minutes ago',
      icon: <FaUserCheck className="text-info" />,
    },
    {
      id: 4,
      type: 'block_mined',
      message: 'New block added to blockchain',
      time: '15 minutes ago',
      icon: <FaCube className="text-warning" />,
    },
  ];

  const displayActivities = activities || mockActivities;

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Recent Activity</h5>
      </Card.Header>
      <Card.Body className="p-0">
        <ListGroup variant="flush">
          {displayActivities.map((activity) => (
            <ListGroup.Item key={activity.id} className="d-flex align-items-center">
              <div className="me-3">
                {activity.icon}
              </div>
              <div className="flex-grow-1">
                <div className="fw-medium">{activity.message}</div>
                <small className="text-muted">{activity.time}</small>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default RecentActivity;