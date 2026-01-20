import React from 'react';
import { Container } from 'react-bootstrap';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <Container>
        <div className="row">
          <div className="col-md-6">
            <h5>Blockchain Voting System</h5>
            <p className="mb-0">
              Secure, transparent, and tamper-proof voting powered by blockchain technology.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="mb-1">
              <small>&copy; {currentYear} Voting System. All rights reserved.</small>
            </p>
            <p className="mb-0">
              <small>Built with React, Node.js, PHP, and Python</small>
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;