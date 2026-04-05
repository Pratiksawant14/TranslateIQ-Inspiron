import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Cpu, 
  Box, 
  Binary, 
  ExternalLink,
  Save,
  CheckCircle2,
  Package,
  Database
} from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { toast } from '../hooks/useToast';

const SettingsPage = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('sk-or-v1-********************************');
  const [baseUrl, setBaseUrl] = useState('https://openrouter.ai/api/v1');

  const handleSave = () => {
    toast('Settings saved successfully', 'success');
  };

  const TechBadge = ({ label, color }) => (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${color}`}>
      {label}
    </span>
  );

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-[28px] font-bold text-white leading-tight">
          Settings
        </h1>
        <p className="text-slate-400 mt-1">Configure your API keys and system parameters</p>
      </div>

      <div className="space-y-6">
        {/* API Configuration */}
        <Card className="p-8">
          <div className="flex items-center gap-2 mb-6">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h2 className="font-display font-semibold text-white">API Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="relative">
              <Input 
                label="OpenRouter API Key"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-[32px] p-1.5 text-slate-500 hover:text-white transition-colors"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input 
              label="OpenRouter Base URL"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://openrouter.ai/api/v1"
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Model</label>
              <div className="flex items-center gap-3 bg-[#0F1B2D] p-3 rounded-lg border border-[#1E3A5F]/40 w-fit">
                <Badge variant="exact">anthropic/claude-3.5-sonnet</Badge>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Professional Verified
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1E3A5F]/30 flex justify-end">
              <Button variant="primary" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Save Settings
              </Button>
            </div>
          </div>
        </Card>

        {/* TM Configuration */}
        <Card className="p-8">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="font-display font-semibold text-white">Translation Memory Settings</h2>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Exact Match Threshold</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-display font-bold text-green-400">98%</span>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[180px]">
                  Segments above this score are auto-approved from TM.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Fuzzy Match Threshold</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-display font-bold text-amber-400">75%</span>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[180px]">
                  Segments above this score show as suggestions in review.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Embedding Model</p>
              <div className="flex items-center gap-2 bg-[#0F1B2D] px-3 py-2 rounded border border-[#1E3A5F]/30 w-fit">
                <Binary className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-blue-400 font-mono">BAAI/bge-m3</span>
              </div>
              <p className="text-[10px] text-slate-600 italic">Multilingual universal embeddings</p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Vector Dimensions</p>
              <div className="flex items-center gap-2 bg-[#0F1B2D] px-3 py-2 rounded border border-[#1E3A5F]/30 w-fit">
                <Box className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs text-indigo-400 font-mono">1024</span>
              </div>
              <p className="text-[10px] text-slate-600 italic">Optimized for Qdrant storage</p>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="p-8">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-pink-400" />
            <h2 className="font-display font-semibold text-white">About TranslateIQ</h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Version</p>
                <p className="text-sm font-semibold text-white">1.0.0 MVP</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Purpose</p>
                <p className="text-sm font-semibold text-white">Enterprise Translation Workflows</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Technology Stack</p>
              <div className="flex flex-wrap gap-2">
                <TechBadge label="React" color="bg-blue-500/10 text-blue-400 border border-blue-500/20" />
                <TechBadge label="FastAPI" color="bg-green-500/10 text-green-400 border border-green-500/20" />
                <TechBadge label="Qdrant" color="bg-red-500/10 text-red-400 border border-red-500/20" />
                <TechBadge label="PostgreSQL" color="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" />
                <TechBadge label="Claude 3.5 Sonnet" color="bg-amber-500/10 text-amber-400 border border-amber-500/20" />
                <TechBadge label="BGE-M3" color="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" />
                <TechBadge label="Docling" color="bg-pink-500/10 text-pink-400 border border-pink-500/20" />
              </div>
            </div>

            <div className="pt-4 border-t border-[#1E3A5F]/30 flex items-center justify-between">
              <p className="text-xs text-slate-600">© 2026 TranslateIQ. All rights reserved.</p>
              <a href="#" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                View Documentation <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
