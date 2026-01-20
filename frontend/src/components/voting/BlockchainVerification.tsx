import React, { useState } from 'react';
import { Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaClock } from 'react-icons/fa';

interface BlockchainVerificationProps {
  voteId?: string;
  transactionId?: string;
  onVerify?: () => Promise<any>;
}

const BlockchainVerification: React.FC<BlockchainVerificationProps> = ({
  voteId,
  transactionId,
  onVerify
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleVerify = async () => {
    if (!onVerify) return;

    setIsVerifying(true);
    try {
      const result = await onVerify();
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({ success: false, error: 'Verification failed' });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = () => {
    if (!verificationResult) return null;

    if (verificationResult.success && verificationResult.data?.exists) {
      return <FaCheckCircle className="text-success" size={20} />;
    } else if (verificationResult.success && !verificationResult.data?.exists) {
      return <FaClock className="text-warning" size={20} />;
    } else {
      return <FaExclamationTriangle className="text-danger" size={20} />;
    }
  };

  const getStatusBadge = () => {
    if (!verificationResult) return null;

    if (verificationResult.success && verificationResult.data?.exists) {
      return <Badge bg="success">Verified on Blockchain</Badge>;
    } else if (verificationResult.success && !verificationResult.data?.exists) {
      return <Badge bg="warning">Pending Confirmation</Badge>;
    } else {
      return <Badge bg="danger">Verification Failed</Badge>;
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0 d-flex align-items-center">
          <FaShieldAlt className="me-2 text-primary" />
          Blockchain Verification
        </h5>
      </Card.Header>
      <Card.Body>
        {(voteId || transactionId) && (
          <div className="mb-3">
            <small className="text-muted">Transaction Details:</small>
            {transactionId && (
              <div className="small">
                <strong>TX ID:</strong> {transactionId}
              </div>
            )}
            {voteId && (
              <div className="small">
                <strong>Vote ID:</strong> {voteId}
              </div>
            )}
          </div>
        )}

        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">
            {getStatusIcon()}
            <span className="ms-2">
              {verificationResult ? 'Verification Complete' : 'Ready for Verification'}
            </span>
          </div>
          {getStatusBadge()}
        </div>

        {verificationResult && (
          <Alert variant={verificationResult.success ? 'success' : 'danger'} className="mb-3">
            {verificationResult.success ? (
              verificationResult.data?.exists ? (
                <div>
                  <strong>✅ Vote Verified!</strong>
                  <br />
                  <small>
                    This vote has been successfully recorded on the blockchain and cannot be altered.
                  </small>
                </div>
              ) : (
                <div>
                  <strong>⏳ Vote Pending</strong>
                  <br />
                  <small>
                    This vote is pending confirmation on the blockchain network.
                  </small>
                </div>
              )
            ) : (
              <div>
                <strong>❌ Verification Failed</strong>
                <br />
                <small>
                  {verificationResult.error || 'Unable to verify vote on blockchain.'}
                </small>
              </div>
            )}
          </Alert>
        )}

        <Button
          variant="outline-primary"
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-100"
        >
          {isVerifying ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Verifying...
            </>
          ) : (
            <>
              <FaShieldAlt className="me-2" />
              Verify on Blockchain
            </>
          )}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default BlockchainVerification;