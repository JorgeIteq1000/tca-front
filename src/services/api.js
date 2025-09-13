import axios from 'axios';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔧 Configuração da API Frontend:');
console.log(`   Base URL: ${API_BASE_URL}`);
console.log(`   Timeout: 30 segundos`);

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🔍 Fazendo requisição: ${config.method?.toUpperCase()} ${config.url}`);
    if (config.params) {
      console.log(`   Parâmetros:`, config.params);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Resposta recebida: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Erro na resposta da API:');
    console.error(`   URL: ${error.config?.url}`);
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Mensagem: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Servidor backend não está rodando ou não está acessível');
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('💡 Erro de rede - verifique a conexão');
    } else if (error.code === 'ECONNABORTED') {
      console.error('💡 Timeout da requisição - servidor demorou para responder');
    }
    
    // Se o token expirou ou é inválido, redirecionar para login
    if (error.response?.status === 401) {
      console.log('🔒 Token inválido ou expirado, redirecionando para login...');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      
      // Só redirecionar se não estiver na página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  // Login
  async login(username, password) {
    try {
      console.log(`🔐 Tentando fazer login com usuário: ${username}`);
      const response = await api.post('/login', { username, password });
      
      if (response.data.success) {
        console.log('✅ Login bem-sucedido!');
        // Armazenar dados de autenticação
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('username', response.data.username);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error.response?.data || { 
        error: 'Erro de conexão', 
        message: 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.' 
      };
    }
  },

  // Verificar token
  async verifyToken() {
    try {
      const response = await api.post('/verify-token');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Token inválido' };
    }
  },

  // Logout
  async logout() {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar dados locais independentemente do resultado
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
    }
  },

  // Verificar se está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Obter role do usuário
  getUserRole() {
    return localStorage.getItem('role');
  },

  // Obter username
  getUsername() {
    return localStorage.getItem('username');
  }
};

// Serviços de dados
export const dataService = {
  // Buscar dados de qualquer módulo
  async getData(modulo, params = {}) {
    try {
      console.log(`📊 Buscando dados do módulo: ${modulo}`);
      const response = await api.get(`/dados/${modulo}`, { params });
      console.log(`✅ Dados recebidos: ${response.data.data?.length || 0} registros`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar dados do módulo ${modulo}:`, error);
      throw error.response?.data || { 
        error: 'Erro ao buscar dados',
        message: 'Não foi possível conectar ao servidor ou buscar os dados solicitados.'
      };
    }
  },

  // Buscar sugestões para autocomplete
  async getSuggestions(modulo, termo) {
    try {
      console.log(`🔍 Buscando sugestões para ${modulo} com termo: ${termo}`);
      const response = await api.get(`/sugestoes/${modulo}`, { 
        params: { termo } 
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar sugestões para ${modulo}:`, error);
      throw error.response?.data || { error: 'Erro ao buscar sugestões' };
    }
  },

  // Buscar todos os dados de uma pessoa (BUSCAR TUDO)
  async getAllPersonData(termo) {
    try {
      console.log(`🔍 Buscando todos os dados para: ${termo}`);
      const response = await api.get('/buscar-tudo', { 
        params: { termo } 
      });
      console.log('✅ Dados completos recebidos');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar todos os dados:', error);
      throw error.response?.data || { 
        error: 'Erro ao buscar dados completos',
        message: 'Não foi possível buscar todos os dados da pessoa.'
      };
    }
  },

  // Buscar pessoa por ID
  async getPersonById(id) {
    try {
      const response = await api.get(`/pessoa/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Pessoa não encontrada' };
    }
  },

  // Verificar se pessoa existe
  async checkPersonExists(id) {
    try {
      const response = await api.get(`/pessoa/${id}/exists`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao verificar pessoa' };
    }
  },

  // Buscar documentos por pessoa
  async getDocumentsByPerson(id) {
    try {
      const response = await api.get(`/documento/pessoa/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao buscar documentos' };
    }
  },

  // Buscar ocorrências por aluno
  async getOccurrencesByStudent(id) {
    try {
      const response = await api.get(`/ocorrencia/aluno/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao buscar ocorrências' };
    }
  },

  // Criar nova ocorrência
  async createOccurrence(data) {
    try {
      const response = await api.post('/ocorrencias', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao criar ocorrência' };
    }
  }
};

// Serviço de health check
export const healthService = {
  async check() {
    try {
      console.log('🏥 Verificando status do servidor...');
      const response = await api.get('/health');
      console.log('✅ Servidor está funcionando:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Servidor não está respondendo:', error);
      throw error.response?.data || { 
        error: 'Servidor indisponível',
        message: 'O servidor backend não está respondendo. Verifique se está rodando na porta 5000.'
      };
    }
  }
};

// Exportar instância da API para uso direto se necessário
export default api;

