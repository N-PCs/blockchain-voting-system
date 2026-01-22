import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaUser, FaVoteYea, FaShieldAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import LanguageSelector from '@/components/common/LanguageSelector';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="navbar-government shadow">
      <Container fluid>
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center navbar-brand-custom">
          <div className="brand-icon">
            <FaShieldAlt className="me-2" />
          </div>
          <div className="brand-text">
            <div className="brand-title">{t('navbar.title')}</div>
            <div className="brand-tagline">{t('navbar.tagline')}</div>
          </div>
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle aria-controls="navbar-nav" />

        <BootstrapNavbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-center">
            {user ? (
              <>
                <Nav.Item className="me-3 welcome-text">
                  <span className="text-light">
                    {t('navbar.welcomeMessage', { firstName: user.firstName, lastName: user.lastName })}
                  </span>
                </Nav.Item>

                <Nav.Link as={Link} to="/profile" className="me-2">
                  <FaUser className="me-1" />
                  {t('common.profile')}
                </Nav.Link>

                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={handleLogout}
                  className="d-flex align-items-center me-2"
                >
                  <FaSignOutAlt className="me-1" />
                  {t('common.logout')}
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="me-2">
                  {t('common.login')}
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="me-2">
                  {t('auth.register')}
                </Nav.Link>
              </>
            )}
            
            <LanguageSelector />
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;