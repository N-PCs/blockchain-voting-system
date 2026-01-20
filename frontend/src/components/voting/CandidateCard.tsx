import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { FaUser, FaVoteYea } from 'react-icons/fa';
import { Candidate } from '@/types';

interface CandidateCardProps {
  candidate: Candidate;
  selected?: boolean;
  onSelect?: (candidate: Candidate) => void;
  showVoteButton?: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  selected = false,
  onSelect,
  showVoteButton = true
}) => {
  const handleSelect = () => {
    if (onSelect) {
      onSelect(candidate);
    }
  };

  return (
    <Card className={`mb-3 ${selected ? 'border-primary shadow' : ''}`}>
      <Card.Body>
        <div className="d-flex align-items-start">
          <div className="flex-shrink-0 me-3">
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                 style={{ width: '60px', height: '60px' }}>
              <FaUser size={24} className="text-secondary" />
            </div>
          </div>
          <div className="flex-grow-1">
            <h5 className="mb-1">{candidate.name}</h5>
            <p className="text-muted mb-2">{candidate.position}</p>
            <div className="mb-2">
              <Badge bg="secondary" className="me-2">
                {candidate.partyAffiliation}
              </Badge>
            </div>
            {candidate.biography && (
              <p className="small text-muted mb-3">{candidate.biography}</p>
            )}
          </div>
        </div>

        {showVoteButton && (
          <div className="mt-3">
            <Button
              variant={selected ? 'primary' : 'outline-primary'}
              className="w-100"
              onClick={handleSelect}
            >
              <FaVoteYea className="me-2" />
              {selected ? 'Selected' : 'Select Candidate'}
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default CandidateCard;