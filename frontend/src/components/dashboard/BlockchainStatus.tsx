import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { FaLink, FaCube, FaClock, FaCheckCircle } from 'react-icons/fa';

interface BlockchainStatusProps {
  stats: any;
}

const BlockchainStatus: React.FC<BlockchainStatusProps> = ({ stats }) => {
  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          <FaLink className="me-2" />
          Blockchain Status
        </h5>
      </Card.Header>
      <Card.Body>
        {stats ? (
          <div className="row">
            <div className="col-md-3 mb-3">
              <div className="text-center">
                <FaCube size={32} className="text-primary mb-2" />
                <h4>{stats.chainLength || 0}</h4>
                <small className="text-muted">Blocks</small>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="text-center">
                <FaClock size={32} className="text-warning mb-2" />
                <h4>{stats.pendingTransactions || 0}</h4>
                <small className="text-muted">Pending TX</small>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="text-center">
                <FaCheckCircle size={32} className="text-success mb-2" />
                <h4>{stats.totalTransactions || 0}</h4>
                <small className="text-muted">Total TX</small>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="text-center">
                <Badge bg={stats.isValid ? 'success' : 'danger'} className="fs-6 p-2">
                  {stats.isValid ? 'Valid' : 'Invalid'}
                </Badge>
                <br />
                <small className="text-muted mt-2 d-block">Chain Status</small>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <FaLink size={48} className="text-muted mb-3" />
            <p className="text-muted mb-0">Blockchain stats not available</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default BlockchainStatus;