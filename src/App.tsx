import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Guard } from './components/Guard';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ParticipantProfile from './pages/ParticipantProfile';
import Leaderboard from './pages/Leaderboard';
import Scoreboard from './pages/Scoreboard';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Missions from './pages/Missions';
import Butterfly from './pages/Butterfly';
import NotFound from './pages/NotFound';

import AdminLogin from './pages/admin/AdminLogin';
import AdminShell from './pages/admin/AdminShell';
import AdminOverview from './pages/admin/AdminOverview';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminParticipants from './pages/admin/AdminParticipants';
import AdminTeams from './pages/admin/AdminTeams';
import AdminButterfly from './pages/admin/AdminButterfly';
import AdminSettings from './pages/admin/AdminSettings';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/** صفحة الشاشة الكبيرة بلا أي قوائم أو أدوات تحكم. */
function Bare({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/scoreboard" element={<Bare><Scoreboard /></Bare>} />

        <Route path="/" element={<Layout><Landing /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />
        <Route path="/top10" element={<Layout><Leaderboard topOnly /></Layout>} />
        <Route path="/teams" element={<Layout><Teams /></Layout>} />
        <Route path="/team" element={<Layout><TeamDetail /></Layout>} />
        <Route path="/missions" element={<Layout><Missions /></Layout>} />

        <Route path="/dashboard" element={<Guard role="participant"><Layout><Dashboard /></Layout></Guard>} />
        <Route path="/participant" element={<Guard><Layout><ParticipantProfile /></Layout></Guard>} />
        <Route path="/butterfly" element={<Guard role="participant"><Layout><Butterfly /></Layout></Guard>} />

        <Route path="/admin/login" element={<Layout><AdminLogin /></Layout>} />
        <Route path="/admin" element={<Guard role="admin"><Layout><AdminShell /></Layout></Guard>}>
          <Route index element={<AdminOverview />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="participants" element={<AdminParticipants />} />
          <Route path="teams" element={<AdminTeams />} />
          <Route path="butterfly" element={<AdminButterfly />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </>
  );
}
