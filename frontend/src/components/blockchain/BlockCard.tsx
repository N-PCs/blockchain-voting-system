import React from 'react';
import { Card, Badge, ListGroup } from 'react-bootstrap';
import { FaCube, FaClock, FaUser, FaHashtag } from 'react-icons/fa';
import { Block } from '@/types';

interface BlockCardProps {
  block: Block;
  onClick?: (block: Block) => void;
}

const BlockCard: React.FC<BlockCardProps> = ({ block, onClick }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Card className="mb-3 shadow-sm" onClick={() => onClick?.(block)} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <FaCube className="me-2 text-primary" />
          <h6 className="mb-0">Block #{block.index}</h6>
        </div>
        <Badge bg="secondary">
          <FaHashtag className="me-1" />
          {block.nonce}
        </Badge>
      </Card.Header>
      <Card.Body>
        <div className="row mb-2">
          <div className="col-6">
            <small className="text-muted">Transactions</small>
            <div className="fw-bold">{block.transactionCount}</div>
          </div>
          <div className="col-6">
            <small className="text-muted">Mined by</small>
            <div className="fw-bold small">
              <FaUser className="me-1" />
              {block.minedBy}
            </div>
          </div>
        </div>

        <div className="mb-2">
          <small className="text-muted">Timestamp</small>
          <div className="small">
            <FaClock className="me-1" />
            {formatTime(block.timestamp)}
          </div>
        </div>

        <div className="mb-2">
          <small className="text-muted">Hash</small>
          <div className="small font-monospace text-truncate" title={block.hash}>
            {block.hash.substring(0, 16)}...
          </div>
        </div>

        {block.transactions && block.transactions.length > 0 && (
          <div>
            <small className="text-muted">Recent Transactions</small>
            <ListGroup variant="flush" className="mt-1">
              {block.transactions.slice(0, 2).map((tx, index) => (
                <ListGroup.Item key={index} className="px-2 py-1 small">
                  <div className="font-monospace text-truncate" title={tx.transactionId}>
                    {tx.transactionId?.substring(0, 12)}...
                  </div>
                  <Badge bg="outline-secondary" className="ms-1">
                    {tx.type}
                  </Badge>
                </ListGroup.Item>
              ))}
              {block.transactions.length > 2 && (
                <ListGroup.Item className="px-2 py-1 small text-muted">
                  +{block.transactions.length - 2} more transactions
                </ListGroup.Item>
              )}
            </ListGroup>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default BlockCard;