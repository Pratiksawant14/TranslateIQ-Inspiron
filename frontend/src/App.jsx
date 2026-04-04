import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Card from './components/ui/Card';
import Toast from './components/ui/Toast';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ValidationPage from './pages/ValidationPage';
import ReviewEditor from './pages/ReviewEditor';
import GlossaryPage from './pages/GlossaryPage';
import StyleProfilesPage from './pages/StyleProfilesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';



function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/projects/:projectId/documents/:documentId/validate" element={<ValidationPage />} />
          <Route path="/projects/:projectId/documents/:documentId/review" element={<ReviewEditor />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/styles" element={<StyleProfilesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppLayout>
      <Toast />
    </BrowserRouter>
  );
}

export default App;
