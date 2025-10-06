import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from './app/layout/RootLayout';
import { AuthProvider } from './app/providers/AuthProvider';
import { ProtectedRoute } from './app/features/auth/guards/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import GoalsPage from './pages/GoalsPage';
import GoalFormPage from './pages/GoalFormPage';
import RecordNewPage from './pages/RecordNewPage';
import ReviewPage from './pages/ReviewPage';
import FlowTheoryPage from './pages/FlowTheoryPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * App defines the top-level routing configuration for the application. The
 * AuthProvider is placed here so that all routes have access to
 * authentication state. ProtectedRoute is used to wrap pages that require
 * authentication.
 */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="login" element={<LoginPage />} />
          <Route path="goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
          <Route path="goal/new" element={<ProtectedRoute><GoalFormPage /></ProtectedRoute>} />
          <Route path="goal/:id" element={<ProtectedRoute><GoalFormPage /></ProtectedRoute>} />
          <Route path="record" element={<ProtectedRoute><RecordNewPage /></ProtectedRoute>} />
          <Route path="review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
          <Route path="flow-theory" element={<FlowTheoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;
