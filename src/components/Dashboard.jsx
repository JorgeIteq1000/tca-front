import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Award, 
  AlertTriangle, 
  GraduationCap, 
  ClipboardList, 
  UserCheck, 
  PlusCircle,
  DollarSign,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { authService } from '../services/api';
import DataViewer from './DataViewer';
import NovaOcorrencia from './NovaOcorrencia';
import '../App.css';

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState('pessoa');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Módulos disponíveis
  const modules = [
    { id: 'pessoa', name: 'Pessoa', icon: Users, description: 'Dados pessoais dos usuários' },
    { id: 'documento', name: 'Documento', icon: FileText, description: 'Documentos acadêmicos' },
    { id: 'certificado', name: 'Certificado', icon: Award, description: 'Certificados emitidos' },
    { id: 'ocorrencia', name: 'Ocorrência', icon: AlertTriangle, description: 'Histórico de ocorrências' },
    { id: 'notafalta', name: 'Nota/Falta', icon: GraduationCap, description: 'Notas e faltas dos alunos' },
    { id: 'requerimento', name: 'Requerimento', icon: ClipboardList, description: 'Solicitações acadêmicas' },
    { id: 'matricula', name: 'Matrícula', icon: UserCheck, description: 'Dados de matrícula' },
    { id: 'ocorrencia-novo', name: 'Ocorrências (Novo)', icon: PlusCircle, description: 'Inserção de novas ocorrências' },
  ];

  // Módulo financeiro (apenas para admin)
  const financialModule = { 
    id: 'financeiro', 
    name: 'Financeiro', 
    icon: DollarSign, 
    description: 'Informações financeiras' 
  };

  useEffect(() => {
    // Verificar autenticação
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Obter dados do usuário
    const username = authService.getUsername();
    const role = authService.getUserRole();
    
    setUser({ username, role });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, redirecionar para login
      navigate('/login');
    }
  };

  const handleModuleClick = (moduleId) => {
    setActiveModule(moduleId);
    // Fechar sidebar em telas menores
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const renderContent = () => {
    if (activeModule === 'ocorrencia-novo') {
      return <NovaOcorrencia />;
    }
    
    return <DataViewer module={activeModule} />;
  };

  const getModuleTitle = () => {
    const module = [...modules, financialModule].find(m => m.id === activeModule);
    return module ? module.name : 'Dashboard';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--tca-primary)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tca-layout">
      {/* Sidebar */}
      <div className="tca-sidebar">
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tca-primary-text">Portal TCA</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Sistema de Gestão Acadêmica</p>
        </div>

        {/* Navegação */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleClick(module.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeModule === module.id
                      ? 'bg-[var(--tca-primary)] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{module.name}</span>
                </button>
              );
            })}
            
            {/* Módulo Financeiro (apenas para admin) */}
            {user.role === 'admin' && (
              <button
                onClick={() => handleModuleClick(financialModule.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeModule === financialModule.id
                    ? 'bg-[var(--tca-primary)] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <financialModule.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{financialModule.name}</span>
              </button>
            )}
          </nav>
        </div>

        {/* Footer da Sidebar */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{user.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="tca-main-content">
        {/* Header */}
        <header className="tca-header p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">{getModuleTitle()}</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bem-vindo, <span className="font-medium">{user.username}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Área de Conteúdo */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

