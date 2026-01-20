import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

// Layout components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';

// Auth pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Profile from '@/pages/auth/Profile';

// Voting pages
import Dashboard from '@/pages/dashboard/Dashboard';
import Elections from '@/pages/voting/Elections';
import Vote from '@/pages/voting/Vote';
import VotingHistory from '@/pages/voting/VotingHistory';

// Blockchain pages
import BlockchainExplorer from '@/pages/blockchain/Explorer';
import BlockDetails from '@/pages/blockchain/BlockDetails';
import TransactionDetails from '@/pages/blockchain/TransactionDetails';

// Admin pages
import AdminDashboard from '@/pages/admin/Dashboard';
import PendingRegistrations from '@/pages/admin/PendingRegistrations';
import ElectionResults from '@/pages/admin/ElectionResults';
import AuditTrail from '@/pages/admin/AuditTrail';

// Components
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';

const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { connect, disconnect } = useWebSocket();

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Router>
      <ErrorBoundary>
        <div className="app-container">
          <Navbar />
          <div className="main-content">
            {user && <Sidebar />}
            <Container fluid className="content-area">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Voting routes */}
                <Route
                  path="/elections"
                  element={
                    <ProtectedRoute>
                      <Elections />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/elections/:id/vote"
                  element={
                    <ProtectedRoute>
                      <Vote />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/votes/history"
                  element={
                    <ProtectedRoute>
                      <VotingHistory />
                    </ProtectedRoute>
                  }
                />

                {/* Blockchain routes */}
                <Route
                  path="/blockchain"
                  element={
                    <ProtectedRoute>
                      <BlockchainExplorer />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/blockchain/blocks/:index"
                  element={
                    <ProtectedRoute>
                      <BlockDetails />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/blockchain/transactions/:id"
                  element={
                    <ProtectedRoute>
                      <TransactionDetails />
                    </ProtectedRoute>
                  }
                />

                {/* Admin routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/pending-registrations"
                  element={
                    <ProtectedRoute requireAdmin>
                      <PendingRegistrations />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/elections/:id/results"
                  element={
                    <ProtectedRoute requireAdmin>
                      <ElectionResults />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/elections/:id/audit"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AuditTrail />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Container>
          </div>
          <Footer />
        </div>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </ErrorBoundary>
    </Router>
  );
};

export default App;