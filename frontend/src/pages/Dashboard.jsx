import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  FileText,
  CheckCircle2,
  Database,
  ArrowRight,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { getProjects } from '../lib/api/projects';
import Card from '../components/ui/Card';
import Stat from '../components/ui/Stat';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const Dashboard = () => {
  const navigate = useNavigate();

  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const totalProjects = projects?.length || 0;

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>Overview of your translation workspace</p>
        </div>

        {/* Stat skeletons */}
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-3 rounded w-24" style={{ backgroundColor: 'var(--color-border)' }} />
                <div className="h-8 rounded w-16" style={{ backgroundColor: 'var(--color-border)' }} />
                <div className="h-3 rounded w-20" style={{ backgroundColor: 'var(--color-border-light)' }} />
              </div>
            </Card>
          ))}
        </div>

        {/* Table skeleton */}
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 rounded w-40" style={{ backgroundColor: 'var(--color-border)' }} />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded" style={{ backgroundColor: 'var(--color-border-light)' }} />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>Overview of your translation workspace</p>
        </div>
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-error)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Failed to load dashboard</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>Could not connect to the server. Please check if the backend is running.</p>
        </Card>
      </div>
    );
  }

  // Empty state
  if (totalProjects === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>Overview of your translation workspace</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Stat label="Total Projects" value="0" subtitle="No projects yet" icon={FolderOpen} color="primary" />
          <Stat label="Total Documents" value="0" subtitle="Upload a document" icon={FileText} color="info" />
          <Stat label="Segments Approved" value="0" subtitle="Start reviewing" icon={CheckCircle2} color="success" />
          <Stat label="TM Entries" value="0" subtitle="Memory is empty" icon={Database} color="warning" />
        </div>

        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <FolderOpen className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
          </div>
          <h3 className="text-xl font-semibold font-display mb-2" style={{ color: 'var(--color-text-primary)' }}>No projects yet</h3>
          <p className="mb-6 max-w-md" style={{ color: 'var(--color-text-secondary)' }}>
            Create your first project to get started with AI-powered translation.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate('/projects')}>
            <Plus className="w-5 h-5 mr-2" />
            Create Project
          </Button>
        </Card>
      </div>
    );
  }

  // Data loaded
  return (
    <div className="space-y-6">
      {/* Header area — matching reference design */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
            TranslateIQ
          </h1>
          <p className="mt-0.5" style={{ color: '#0F172A' }}>
            Enterprise translation and AI workspace
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/projects')}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Active Projects" value={totalProjects} subtitle="Active projects" icon={FolderOpen} color="primary" />
        <Stat label="Total Documents" value={0} subtitle="Across all projects" icon={FileText} color="info" />
        <Stat label="Segments Approved" value={0} subtitle="Ready for export" icon={CheckCircle2} color="success" />
        <Stat label="TM Entries" value={0} subtitle="Translation memory" icon={Database} color="warning" />
      </div>

      {/* Recent Projects Table */}
      <Card variant="elevated" className="p-0">
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h2 className="font-semibold font-display text-lg" style={{ color: 'var(--color-text-primary)' }}>
            Recent Projects Overview
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Project Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Source Language</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Documents</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Created</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 7).map((project) => (
                <tr
                  key={project.id}
                  className="cursor-pointer transition-colors duration-150"
                  style={{ borderBottom: '1px solid var(--color-border-light)' }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-base)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{project.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="primary">{project.source_language}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>0</td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>{formatDate(project.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm">
                      Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
