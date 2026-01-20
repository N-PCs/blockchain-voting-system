import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { FaVoteYea, FaClock } from 'react-icons/fa';

interface RecentVotesProps {
  votes: any[];
}

const RecentVotes: React.FC<RecentVotesProps> = ({ votes }) => {
  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          <FaVoteYea className="me-2" />
          Recent Votes
        </h5>
      </Card.Header>
      <Card.Body className="p-0">
        {votes.length > 0 ? (
          <ListGroup variant="flush">
            {votes.slice(0, 5).map((vote, index) => (
              <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">
                    Vote #{vote.voteId || vote.id}
                  </small>
                  <br />
                  <small>
                    Election: {vote.electionId}
                  </small>
                </div>
                <div className="text-end">
                  <small className="text-muted">
                    <FaClock className="me-1" />
                    {new Date(vote.timestamp || vote.castedAt).toLocaleTimeString()}
                  </small>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <div className="text-center py-4">
            <FaVoteYea size={48} className="text-muted mb-3" />
            <p className="text-muted mb-0">No recent votes</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default RecentVotes;