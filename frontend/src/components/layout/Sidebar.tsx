import React from 'react';
import { Nav, NavItem, NavLink } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaVoteYea,
  FaHistory,
  FaLink,
  FaCog,
  FaUsers
} from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isAdmin = user?.userType === 'admin';

  return (
    <div className="sidebar bg-light border-end" style={{ width: '250px', minHeight: 'calc(100vh - 76px)' }}>
      <Nav className="flex-column p-3">
        <NavItem className="mb-2">
          <NavLink
            as={Link}
            to="/"
            className={`d-flex align-items-center ${isActive('/') ? 'active bg-primary text-white' : 'text-dark'}`}
          >
            <FaTachometerAlt className="me-2" />
            Dashboard
          </NavLink>
        </NavItem>

        <NavItem className="mb-2">
          <NavLink
            as={Link}
            to="/elections"
            className={`d-flex align-items-center ${isActive('/elections') ? 'active bg-primary text-white' : 'text-dark'}`}
          >
            <FaVoteYea className="me-2" />
            Elections
          </NavLink>
        </NavItem>

        <NavItem className="mb-2">
          <NavLink
            as={Link}
            to="/votes/history"
            className={`d-flex align-items-center ${isActive('/votes/history') ? 'active bg-primary text-white' : 'text-dark'}`}
          >
            <FaHistory className="me-2" />
            Voting History
          </NavLink>
        </NavItem>

        <NavItem className="mb-2">
          <NavLink
            as={Link}
            to="/blockchain"
            className={`d-flex align-items-center ${isActive('/blockchain') ? 'active bg-primary text-white' : 'text-dark'}`}
          >
            <FaLink className="me-2" />
            Blockchain Explorer
          </NavLink>
        </NavItem>

        {isAdmin && (
          <>
            <hr className="my-3" />
            <div className="sidebar-section-title text-muted mb-2">
              <small className="fw-bold text-uppercase">Admin Panel</small>
            </div>

            <NavItem className="mb-2">
              <NavLink
                as={Link}
                to="/admin"
                className={`d-flex align-items-center ${isActive('/admin') ? 'active bg-primary text-white' : 'text-dark'}`}
              >
                <FaCog className="me-2" />
                Admin Dashboard
              </NavLink>
            </NavItem>

            <NavItem className="mb-2">
              <NavLink
                as={Link}
                to="/admin/pending-registrations"
                className={`d-flex align-items-center ${isActive('/admin/pending-registrations') ? 'active bg-primary text-white' : 'text-dark'}`}
              >
                <FaUsers className="me-2" />
                Pending Registrations
              </NavLink>
            </NavItem>
          </>
        )}
      </Nav>
    </div>
  );
};

export default Sidebar;