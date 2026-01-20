import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { FaExchangeAlt, FaVoteYea, FaClock } from 'react-icons/fa';
import { Transaction } from '@/types';

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  title = "Transactions"
}) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'vote':
        return <FaVoteYea className="text-primary" />;
      case 'coinbase':
        return <FaExchangeAlt className="text-success" />;
      default:
        return <FaExchangeAlt className="text-secondary" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'vote':
        return <Badge bg="primary">Vote</Badge>;
      case 'coinbase':
        return <Badge bg="success">Mining Reward</Badge>;
      default:
        return <Badge bg="secondary">{type}</Badge>;
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          <FaExchangeAlt className="me-2" />
          {title}
        </h5>
      </Card.Header>
      <Card.Body className="p-0">
        {transactions.length > 0 ? (
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Type</th>
                  <th>Transaction ID</th>
                  <th>Details</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={tx.transactionId || index}>
                    <td>
                      <div className="d-flex align-items-center">
                        {getTransactionIcon(tx.type)}
                        <span className="ms-2">{getTransactionBadge(tx.type)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-monospace small text-truncate" style={{ maxWidth: '120px' }} title={tx.transactionId}>
                        {tx.transactionId?.substring(0, 16)}...
                      </div>
                    </td>
                    <td>
                      <div className="small">
                        {tx.type === 'vote' && tx.voterId && (
                          <div>
                            <strong>Voter:</strong> {tx.voterId.substring(0, 8)}...
                            {tx.candidateId && (
                              <>
                                <br />
                                <strong>Candidate:</strong> {tx.candidateId.substring(0, 8)}...
                              </>
                            )}
                          </div>
                        )}
                        {tx.type === 'coinbase' && (
                          <div>
                            <strong>Mining Reward</strong>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="small text-muted">
                        <FaClock className="me-1" />
                        {tx.formattedTime || formatTime(tx.timestamp)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-5">
            <FaExchangeAlt size={48} className="text-muted mb-3" />
            <p className="text-muted mb-0">No transactions found</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default TransactionList;