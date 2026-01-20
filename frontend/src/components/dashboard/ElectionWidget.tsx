import React from 'react';
import { Card, ListGroup, Badge, Button } from 'react-bootstrap';
import { FaVoteYea, FaCalendarAlt, FaUsers } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Election } from '@/types';

interface ElectionWidgetProps {
  elections: Election[];
}

const ElectionWidget: React.FC<ElectionWidgetProps> = ({ elections }) => {
  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          <FaVoteYea className="me-2" />
          Active Elections
        </h5>
      </Card.Header>
      <Card.Body className="p-0">
        {elections.length > 0 ? (
          <>
            <ListGroup variant="flush">
              {elections.slice(0, 3).map((election) => (
                <ListGroup.Item key={election.id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{election.title}</h6>
                      <small className="text-muted d-block">
                        <FaCalendarAlt className="me-1" />
                        {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
                      </small>
                      <small className="text-muted d-block">
                        <FaUsers className="me-1" />
                        {election.electionType}
                      </small>
                    </div>
                    <Badge bg="success" className="ms-2">Active</Badge>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
            <div className="p-3">
              <Button as={Link as any} to="/elections" variant="outline-primary" className="w-100">
                View All Elections
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <FaVoteYea size={48} className="text-muted mb-3" />
            <p className="text-muted mb-0">No active elections</p>
            <Button as={Link as any} to="/elections" variant="outline-primary" className="mt-2">
              Browse Elections
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ElectionWidget;