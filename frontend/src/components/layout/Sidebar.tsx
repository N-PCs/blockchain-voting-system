import React from 'react';
import { Nav, NavItem, NavLink } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaTachometerAlt,
  FaVoteYea,
  FaHistory,
  FaLink,
  FaCog,
  FaUsers,
  FaChartLine
} from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isAdmin = user?.userType === 'admin';

  const getSidebarItemClass = (path: string) => {
    return `d-flex align-items-center sidebar-item ${isActive(path) ? 'active' : ''}`;
  };

  return (
    <div className="sidebar sidebar-government border-end">
      <Nav className="flex-column p-3">
        <NavItem className="mb-2">
          <NavLink
            as={Link}
            to="/"
            className={getSidebarItemClass('/')}
          >
            <FaTachometerAlt className="me-2" />
            {t('sidebar.dashboard')}
          </NavLink>
        </NavItem>

        <NavItem className="mb-2">
          <NavLink
            as={Link}
            to="/elections"
            className={getSidebarItemClass('/elections')}
          >
            <FaVoteYea className="me-2" />
            {t('sidebar.elections')}
          </NavLink>
        </NavItem>

        <NavItem className="mb-2">
          <NavLink
            as={Link}
            to="/votes/history"
            className={getSidebarItemClass('/votes/history')}
          >
            <FaHistory className="me-2" />
            {t('sidebar.votingHistory')}
          </NavLink>
        </NavItem>

        <NavItem className="mb-2">
          <NavLink
            as={Link}
            to="/blockchain"
            className={getSidebarItemClass('/blockchain')}
          >
            <FaLink className="me-2" />
            {t('sidebar.blockchainExplorer')}
          </NavLink>
        </NavItem>

        {isAdmin && (
          <>
            <hr className="my-3 border-secondary" />
            <div className="sidebar-section-title text-muted mb-3">
              <small className="fw-bold text-uppercase">{t('sidebar.admin')}</small>
            </div>

            <NavItem className="mb-2">
              <NavLink
                as={Link}
                to="/admin"
                className={getSidebarItemClass('/admin')}
              >
                <FaCog className="me-2" />
                {t('admin.dashboard')}
              </NavLink>
            </NavItem>

            <NavItem className="mb-2">
              <NavLink
                as={Link}
                to="/admin/pending-registrations"
                className={getSidebarItemClass('/admin/pending-registrations')}
              >
                <FaUsers className="me-2" />
                {t('admin.pendingRegistrations')}
              </NavLink>
            </NavItem>

            <NavItem className="mb-2">
              <NavLink
                as={Link}
                to="/admin/election-results"
                className={getSidebarItemClass('/admin/election-results')}
              >
                <FaChartLine className="me-2" />
                {t('admin.electionResults')}
              </NavLink>
            </NavItem>
          </>
        )}
      </Nav>
    </div>
  );
};

export default Sidebar;