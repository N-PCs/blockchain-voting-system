import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'sm' | 'lg';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullScreen = false,
  size = 'lg',
  message = 'Loading...'
}) => {
  const spinner = (
    <div className="d-flex flex-column align-items-center justify-content-center">
      <Spinner
        animation="border"
        variant="primary"
        size={size === 'lg' ? undefined : size}
        className="mb-3"
      />
      <div className="text-muted">{message}</div>
    </div>
  );

  if (fullScreen) {
    return (
      <Container
        fluid
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '100vh' }}
      >
        {spinner}
      </Container>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center p-4">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;