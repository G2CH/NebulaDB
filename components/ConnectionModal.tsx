import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';
import {
  X,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Server,
  Database,
  Shield,
  Terminal,
  HardDrive,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { connectToDatabase } from '../services/dbService';
import { ConnectionStatus } from '../types';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (connection: any) => void;
  initialConnection?: any;
  onDelete?: (id: string) => void;
}

type DbType = 'postgres' | 'mysql' | 'redis' | 'sqlite';
type Tab = 'general' | 'ssh' | 'ssl';

const DB_TYPES: { id: DbType; label: string; port: string; icon: React.ElementType }[] = [
  { id: 'postgres', label: 'PostgreSQL', port: '5432', icon: Database },
  { id: 'mysql', label: 'MySQL', port: '3306', icon: Database },
  { id: 'redis', label: 'Redis', port: '6379', icon: Server },
  { id: 'sqlite', label: 'SQLite', port: '', icon: HardDrive },
];

// InputField component defined outside to prevent re-creation on every render
const InputField = ({ label, value, onChange, placeholder, type = 'text', className = '' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-[10px] font-bold text-theme-tertiary uppercase tracking-wider">{label}</label>
    <div className="relative group">
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full glass-subtle border border-theme-primary text-theme-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder-zinc-500 group-hover:border-theme-secondary"
      />
    </div>
  </div>
);

const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, onSave, initialConnection, onDelete }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [selectedType, setSelectedType] = useState<DbType>('postgres');
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [formData, setFormData] = useState({
    name: 'New Connection',
    host: 'localhost',
    port: '5432',
    user: 'postgres',
    password: '',
    database: 'postgres',
    sshHost: '',
    sshPort: '22',
    sshUser: '',
    sshKeyPath: '',
  });

  // Update port when DB type changes (only if not editing existing connection)
  useEffect(() => {
    if (initialConnection) return; // Don't change values when editing

    const typeDef = DB_TYPES.find(t => t.id === selectedType);
    if (typeDef) {
      setFormData(prev => ({
        ...prev,
        port: typeDef.port,
        user: selectedType === 'postgres' ? 'postgres' : 'root',
        database: selectedType === 'postgres' ? 'postgres' : ''
      }));
    }
  }, [selectedType]); // Removed initialConnection from dependencies

  // Load initial connection data only when modal opens
  useEffect(() => {
    if (!isOpen) return; // Only run when modal is open

    if (initialConnection) {
      setSelectedType(initialConnection.type);
      setFormData({
        name: initialConnection.name,
        host: initialConnection.host || 'localhost',
        port: initialConnection.port || '',
        user: initialConnection.user || '',
        password: initialConnection.password || '',
        database: initialConnection.database || '',
        sshHost: initialConnection.sshHost || '',
        sshPort: initialConnection.sshPort || '22',
        sshUser: initialConnection.sshUser || '',
        sshKeyPath: initialConnection.sshKeyPath || '',
      });
    } else {
      setFormData({
        name: 'New Connection',
        host: 'localhost',
        port: '5432',
        user: 'postgres',
        password: '',
        database: 'postgres',
        sshHost: '',
        sshPort: '22',
        sshUser: '',
        sshKeyPath: '',
      });
      setSelectedType('postgres');
    }
  }, [isOpen]); // Only depend on isOpen and run when it becomes true

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus('idle');

    try {
      let connectionString = '';
      if (selectedType === 'sqlite') {
        connectionString = `sqlite://${formData.database}`;
      } else {
        connectionString = selectedType === 'mysql'
          ? `mysql://${formData.user}:${formData.password}@${formData.host}:${formData.port}/${formData.database}`
          : `postgres://${formData.user}:${formData.password}@${formData.host}:${formData.port}/${formData.database}`;
      }

      await connectToDatabase('test_conn', selectedType as 'postgres' | 'mysql' | 'sqlite', connectionString);
      setTestStatus('success');
    } catch (e) {
      console.error(e);
      setTestStatus('error');
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const handleConnect = async () => {
    try {
      const id = initialConnection ? initialConnection.id : `conn_${Date.now()}`;
      let connectionString = '';
      if (selectedType === 'sqlite') {
        connectionString = `sqlite://${formData.database}`;
      } else if (selectedType === 'redis') {
        connectionString = `redis://${formData.host}:${formData.port}/`;
      } else {
        connectionString = selectedType === 'mysql'
          ? `mysql://${formData.user}:${formData.password}@${formData.host}:${formData.port}/${formData.database}`
          : `postgres://${formData.user}:${formData.password}@${formData.host}:${formData.port}/${formData.database}`;
      }

      await connectToDatabase(id, selectedType as 'postgres' | 'mysql' | 'sqlite' | 'redis', connectionString);

      onSave({
        id,
        name: formData.name,
        type: selectedType,
        host: formData.host,
        port: formData.port,
        user: formData.user,
        password: formData.password,
        database: formData.database,
        status: ConnectionStatus.CONNECTED,
        sshHost: formData.sshHost,
        sshPort: formData.sshPort,
        sshUser: formData.sshUser,
        sshKeyPath: formData.sshKeyPath
      });
      onClose();
    } catch (e) {
      console.error('Connection failed:', e);
      toast.error(t('connectionModal.connectionFailed', 'Connection failed'), String(e));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[800px] h-[550px] glass-strong rounded-xl shadow-2xl border border-white/10 flex overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Left Sidebar - DB Types */}
        <div className="w-64 bg-zinc-900/50 border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-zinc-100 pl-2">
              {initialConnection ? t('connectionModal.editTitle', 'Edit Connection') : t('connectionModal.title', 'New Connection')}
            </h2>
          </div>
          <div className="flex-1 p-2 space-y-1 overflow-y-auto">
            {DB_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedType(type.id);
                  if (type.port) setFormData(prev => ({ ...prev, port: type.port }));
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                  ${selectedType === type.id
                    ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'}
                `}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center ${selectedType === type.id ? 'bg-violet-500/20' : 'bg-zinc-800'}`}>
                  <type.icon className="w-4 h-4" />
                </div>
                <span className="font-medium">{type.label}</span>
                {selectedType === type.id && <Check className="w-3.5 h-3.5 ml-auto text-violet-400" />}
              </button>
            ))}
          </div>

          {/* Delete Button (if editing) */}
          {initialConnection && onDelete && (
            <div className="p-4 border-t border-white/5">
              <button
                onClick={() => {
                  if (confirm(t('connectionModal.confirmDelete'))) {
                    onDelete(initialConnection.id);
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('connectionModal.delete', 'Delete Connection')}
              </button>
            </div>
          )}
        </div>

        {/* Right Content - Form */}
        <div className="flex-1 flex flex-col bg-zinc-950/30">
          {/* Tabs */}
          <div className="flex items-center gap-6 px-6 border-b border-white/5 bg-white/[0.02]">
            {[
              { id: 'general' as Tab, label: t('connectionModal.tabs.general', 'General') },
              { id: 'ssh' as Tab, label: t('connectionModal.tabs.ssh', 'SSH Tunnel') },
              { id: 'ssl' as Tab, label: t('connectionModal.tabs.ssl', 'SSL') },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={selectedType === 'sqlite' && tab.id !== 'general'}
                className={`
                  relative py-4 text-xs font-medium transition-colors
                  ${activeTab === tab.id ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}
                  ${selectedType === 'sqlite' && tab.id !== 'general' ? 'opacity-30 cursor-not-allowed' : ''}
                `}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                )}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-md hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
              <div className="space-y-5 max-w-lg">
                <InputField
                  label={t('connectionModal.fields.name', 'Connection Name')}
                  value={formData.name}
                  onChange={(v: string) => setFormData({ ...formData, name: v })}
                  placeholder="My Production DB"
                />

                {selectedType !== 'sqlite' && (
                  <div className="grid grid-cols-4 gap-4">
                    <InputField
                      label={t('connectionModal.fields.host', 'Host')}
                      value={formData.host}
                      onChange={(v: string) => setFormData({ ...formData, host: v })}
                      placeholder="127.0.0.1"
                      className="col-span-3"
                    />
                    <InputField
                      label={t('connectionModal.fields.port', 'Port')}
                      value={formData.port}
                      onChange={(v: string) => setFormData({ ...formData, port: v })}
                      placeholder={DB_TYPES.find(t => t.id === selectedType)?.port}
                      className="col-span-1"
                    />
                  </div>
                )}

                {selectedType === 'sqlite' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-theme-tertiary uppercase tracking-wider">{t('connectionModal.fields.dbPath', 'Database Path')}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.database}
                        onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                        className="flex-1 glass-subtle border border-theme-primary text-theme-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500/50"
                        placeholder="/path/to/database.db"
                      />
                      <button className="px-3 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-lg border border-white/5 transition-colors">
                        {t('connectionModal.fields.browse', 'Browse')}
                      </button>
                    </div>
                  </div>
                )}

                {selectedType !== 'sqlite' && (
                  <>
                    <InputField
                      label={t('connectionModal.fields.database', 'Database Name')}
                      value={formData.database}
                      onChange={(v: string) => setFormData({ ...formData, database: v })}
                      placeholder="postgres"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label={t('connectionModal.fields.user', 'Username')}
                        value={formData.user}
                        onChange={(v: string) => setFormData({ ...formData, user: v })}
                        placeholder="postgres"
                      />
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-theme-tertiary uppercase tracking-wider">{t('connectionModal.fields.password', 'Password')}</label>
                        <div className="relative group">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full glass-subtle border border-theme-primary text-theme-primary text-sm rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all group-hover:border-theme-secondary"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'ssh' && (
              <div className="space-y-5 max-w-lg">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
                  <p>{t('connectionModal.sshHint', 'Configure SSH tunneling to connect to a database behind a firewall.')}</p>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <InputField
                    label={t('connectionModal.fields.sshHost', 'SSH Host')}
                    value={formData.sshHost}
                    onChange={(v: string) => setFormData({ ...formData, sshHost: v })}
                    placeholder="ssh.example.com"
                    className="col-span-3"
                  />
                  <InputField
                    label={t('connectionModal.fields.port', 'Port')}
                    value={formData.sshPort}
                    onChange={(v: string) => setFormData({ ...formData, sshPort: v })}
                    placeholder="22"
                    className="col-span-1"
                  />
                </div>
                <InputField
                  label={t('connectionModal.fields.sshUser', 'SSH Username')}
                  value={formData.sshUser}
                  onChange={(v: string) => setFormData({ ...formData, sshUser: v })}
                  placeholder="ubuntu"
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-theme-tertiary uppercase tracking-wider">{t('connectionModal.fields.privateKey', 'Private Key Path')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.sshKeyPath}
                      onChange={e => setFormData({ ...formData, sshKeyPath: e.target.value })}
                      className="flex-1 glass-subtle border border-theme-primary text-theme-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500/50"
                      placeholder="~/.ssh/id_rsa"
                    />
                    <button className="px-3 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-lg border border-white/5 transition-colors">
                      {t('connectionModal.fields.browse', 'Browse')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ssl' && (
              <div className="space-y-5 max-w-lg">
                <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-lg">
                  <input type="checkbox" id="use-ssl" className="rounded border-zinc-700 bg-zinc-900 text-violet-500 focus:ring-violet-500/50" />
                  <label htmlFor="use-ssl" className="text-sm text-zinc-300 select-none cursor-pointer">{t('connectionModal.sslLabel', 'Use SSL/TLS for this connection')}</label>
                </div>
                <div className="opacity-40 pointer-events-none space-y-4">
                  <InputField label={t('connectionModal.fields.caCert', 'CA Certificate')} value="" onChange={() => { }} placeholder="root.crt" />
                  <InputField label={t('connectionModal.fields.clientCert', 'Client Certificate')} value="" onChange={() => { }} placeholder="client.crt" />
                  <InputField label={t('connectionModal.fields.clientKey', 'Client Key')} value="" onChange={() => { }} placeholder="client.key" />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/5 bg-zinc-900/30 flex items-center justify-between">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className={`
                flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all
                ${testStatus === 'success'
                  ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                  : testStatus === 'error'
                    ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'}
              `}
            >
              {isTesting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : testStatus === 'success' ? (
                <Check className="w-3.5 h-3.5" />
              ) : testStatus === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <Shield className="w-3.5 h-3.5" />
              )}
              {isTesting ? t('connectionModal.testing', 'Testing...') :
                testStatus === 'success' ? t('connectionModal.success', 'Connection Successful') :
                  testStatus === 'error' ? t('connectionModal.failed', 'Connection Failed') :
                    t('connectionModal.test', 'Test Connection')}
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {t('connectionModal.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleConnect}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-violet-500/20 transition-all active:scale-95 border border-violet-500/50"
              >
                {initialConnection ? t('connectionModal.saveAndConnect', 'Save & Connect') : t('connectionModal.connect', 'Connect')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionModal;
