import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import TaskDetail from './pages/TaskDetail';
import ChangeRole from './pages/ChangeRole';
import { NotificationProvider } from './context/NotificationProvider';

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <Routes>
          {/* Guest-only Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/projects/:slug/tasks/:taskId" element={<TaskDetail />} />
            <Route path="/change-role" element={<ChangeRole />} />

            {/* Catch-all redirects back to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
