import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import Landing from './pages/Landing';
import { Login, Register } from './pages/Auth';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import LibraryPage from './pages/Library';
import ResourceView from './pages/ResourceView';
import StudentDashboard from './pages/student/Dashboard';
import Quizzes from './pages/student/Quizzes';
import QuizAttempt from './pages/student/QuizAttempt';
import AttemptResult from './pages/student/AttemptResult';
import Progress from './pages/student/Progress';
import TeacherDashboard from './pages/teacher/Dashboard';
import ManageContent from './pages/teacher/ManageContent';
import QuizBuilder from './pages/teacher/QuizBuilder';
import Students from './pages/teacher/Students';

import { homeFor } from './lib/home';

function Protected({ role, children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Spinner className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Spinner className="min-h-screen" />;
  return user ? <Navigate to={homeFor(user)} replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/resource/:id" element={<ResourceView />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/attempts/:id" element={<AttemptResult />} />

        <Route path="/dashboard" element={<Protected role="student"><StudentDashboard /></Protected>} />
        <Route path="/quizzes" element={<Protected role="student"><Quizzes /></Protected>} />
        <Route path="/progress" element={<Protected role="student"><Progress /></Protected>} />

        <Route path="/teacher" element={<Protected role="teacher"><TeacherDashboard /></Protected>} />
        <Route path="/teacher/content" element={<Protected role="teacher"><ManageContent /></Protected>} />
        <Route path="/teacher/quizzes" element={<Protected role="teacher"><QuizBuilder /></Protected>} />
        <Route path="/teacher/students" element={<Protected role="teacher"><Students /></Protected>} />
      </Route>
      {/* Quiz attempt is full-screen, without the sidebar */}
      <Route path="/quiz/:id" element={<Protected role="student"><QuizAttempt /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
