import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaShieldAlt, FaGitAlt, FaTwitter, FaLinkedin } from 'react-icons/fa';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="footer-government">
      <div className="footer-top">
        <Container>
          <Row>
            <Col md={3} sm={6} className="mb-4">
              <div className="footer-section">
                <h6>
                  <FaShieldAlt className="me-2" />
                  {t('common.appName')}
                </h6>
                <p className="footer-description">
                  {t('navbar.tagline')}
                </p>
              </div>
            </Col>

            <Col md={3} sm={6} className="mb-4">
              <div className="footer-section">
                <h6>{t('common.help')}</h6>
                <ul className="footer-links">
                  <li><a href="#about">About</a></li>
                  <li><a href="#contact">Contact Us</a></li>
                  <li><a href="#support">Support</a></li>
                  <li><a href="#faq">FAQ</a></li>
                </ul>
              </div>
            </Col>

            <Col md={3} sm={6} className="mb-4">
              <div className="footer-section">
                <h6>{t('common.about')}</h6>
                <ul className="footer-links">
                  <li><a href="#privacy">Privacy Policy</a></li>
                  <li><a href="#terms">Terms of Service</a></li>
                  <li><a href="#security">Security</a></li>
                  <li><a href="#accessibility">Accessibility</a></li>
                </ul>
              </div>
            </Col>

            <Col md={3} sm={6} className="mb-4">
              <div className="footer-section">
                <h6>{t('common.version')}</h6>
                <p className="mb-3">
                  <small>E-Voting System v1.0.0</small>
                </p>
                <div className="social-links">
                  <a href="#" className="social-link" title="Twitter">
                    <FaTwitter />
                  </a>
                  <a href="#" className="social-link" title="LinkedIn">
                    <FaLinkedin />
                  </a>
                  <a href="#" className="social-link" title="GitHub">
                    <FaGitAlt />
                  </a>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <hr className="footer-divider" />

      <div className="footer-bottom">
        <Container>
          <Row className="align-items-center">
            <Col md={6} className="text-center text-md-start">
              <p className="mb-0">
                <small>&copy; {currentYear} {t('common.government')}. All rights reserved.</small>
              </p>
            </Col>
            <Col md={6} className="text-center text-md-end">
              <p className="mb-0">
                <small>Built with React, TypeScript, Node.js, PHP &amp; Python</small>
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;