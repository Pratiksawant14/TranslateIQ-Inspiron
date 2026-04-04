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
          <h1 className="font-display text-[28px] font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your translation workspace</p>
        </div>

        {/* Stat skeletons */}
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-3 bg-slate-700 rounded w-24" />
                <div className="h-8 bg-slate-700 rounded w-16" />
                <div className="h-3 bg-slate-700 rounded w-20" />
              </div>
            </Card>
          ))}
        </div>

        {/* Table skeleton */}
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-slate-700 rounded w-40" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-800 rounded" />
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
          <h1 className="font-display text-[28px] font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your translation workspace</p>
        </div>
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to load dashboard</h3>
          <p className="text-slate-400">Could not connect to the server. Please check if the backend is running.</p>
        </Card>
      </div>
    );
  }

  // Empty state
  if (totalProjects === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-[28px] font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your translation workspace</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Stat label="Total Projects" value="0" subtitle="No projects yet" icon={FolderOpen} color="blue" />
          <Stat label="Total Documents" value="0" subtitle="Upload a document" icon={FileText} color="purple" />
          <Stat label="Segments Approved" value="0" subtitle="Start reviewing" icon={CheckCircle2} color="green" />
          <Stat label="TM Entries" value="0" subtitle="Memory is empty" icon={Database} color="amber" />
        </div>

        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-display font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-slate-400 mb-6 max-w-md">
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
      <div>
        <h1 className="font-display text-[28px] font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Overview of your translation workspace</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Total Projects" value={totalProjects} subtitle="Active projects" icon={FolderOpen} color="blue" />
        <Stat label="Total Documents" value={0} subtitle="Across all projects" icon={FileText} color="purple" />
        <Stat label="Segments Approved" value={0} subtitle="Ready for export" icon={CheckCircle2} color="green" />
        <Stat label="TM Entries" value={0} subtitle="Translation memory" icon={Database} color="amber" />
      </div>

      {/* Recent Projects Table */}
      <Card>
        <div className="px-6 py-4 border-b border-[#1E3A5F]/50 flex items-center justify-between">
          <h2 className="font-display font-semibold text-white text-lg">Recent Projects</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E3A5F]/30">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Source Language</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Documents</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A5F]/20">
              {projects.slice(0, 5).map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-[#1E3A5F]/10 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-white">{project.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="fuzzy">{project.source_language}</Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-300">0</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{formatDate(project.created_at)}</td>
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
