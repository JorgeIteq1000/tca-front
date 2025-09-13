import React, { useState, useEffect, useCallback } from 'react';
import { Search, Copy, Eye, ChevronLeft, ChevronRight, AlertCircle, MoreHorizontal, User, FileText, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { dataService, healthService } from '../services/api';
import { toast } from 'sonner';
import '../App.css';

const DataViewer = ({ module }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loadingClientData, setLoadingClientData] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    pageSize: 10
  });

  // Verificar status do servidor na inicialização
  useEffect(() => {
    checkServerStatus();
  }, []);

  // Carregar dados quando o módulo mudar
  useEffect(() => {
    if (serverStatus === 'online') {
      fetchData();
    }
  }, [module, serverStatus]);

  const checkServerStatus = async () => {
    try {
      console.log('🔍 Verificando status do servidor...');
      await healthService.check();
      setServerStatus('online');
      setError('');
      console.log('✅ Servidor está online');
    } catch (error) {
      console.error('❌ Servidor offline:', error);
      setServerStatus('offline');
      setError('Erro ao conectar com o servidor. Verifique se o backend está rodando na porta 5000.');
    }
  };

  // Mapear módulos para endpoints da API
  const getModuleEndpoint = (moduleId) => {
    const moduleMap = {
      'pessoa': 'pessoa',
      'documento': 'documento',
      'certificado': 'certificado',
      'ocorrencia': 'ocorrencia',
      'notafalta': 'notafalta',
      'requerimento': 'requerimento',
      'matricula': 'matricula',
      'financeiro': 'financeiro'
    };
    return moduleMap[moduleId] || moduleId;
  };

  // Buscar dados
  const fetchData = useCallback(async (page = 1, search = '') => {
    if (serverStatus === 'offline') {
      setError('Servidor offline. Não é possível buscar dados.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log(`📊 Buscando dados para módulo: ${module}`);
      console.log(`   Página: ${page}, Busca: "${search}"`);
      
      const endpoint = getModuleEndpoint(module);
      const params = {
        page,
        limit: pagination.pageSize,
        ...(search && { search })
      };

      console.log(`🔗 Endpoint: /dados/${endpoint}`);
      console.log(`📋 Parâmetros:`, params);

      const response = await dataService.getData(endpoint, params);
      
      console.log(`📦 Resposta completa da API:`, response);
      
      if (response && response.success) {
        const dataArray = response.data || [];
        console.log(`✅ Dados extraídos: ${dataArray.length} registros`);
        console.log(`📊 Primeiro registro:`, dataArray[0]);
        
        setData(dataArray);
        setPagination(prev => ({
          ...prev,
          currentPage: response.pagination?.currentPage || page,
          totalPages: response.pagination?.totalPages || 1,
          totalRecords: response.pagination?.totalRecords || 0
        }));
        
        console.log(`📄 Paginação atualizada:`, {
          currentPage: response.pagination?.currentPage || page,
          totalPages: response.pagination?.totalPages || 1,
          totalRecords: response.pagination?.totalRecords || 0
        });
      } else {
        console.warn(`⚠️ Resposta sem sucesso:`, response);
        throw new Error(response?.message || 'Erro ao buscar dados');
      }
    } catch (error) {
      console.error('❌ Erro detalhado ao buscar dados:');
      console.error('   Erro:', error);
      console.error('   Mensagem:', error.message);
      console.error('   Código:', error.code);
      console.error('   Response:', error.response);
      
      const errorMessage = error.message || 'Erro ao conectar com o servidor';
      setError(errorMessage);
      
      // Se for erro de conexão, verificar status do servidor novamente
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        console.log('🔄 Marcando servidor como offline devido ao erro de conexão');
        setServerStatus('offline');
      }
    } finally {
      setLoading(false);
    }
  }, [module, pagination.pageSize, serverStatus]);

  // Buscar todos os dados de um cliente (BUSCAR TUDO)
  const fetchAllClientData = async (termo) => {
    if (serverStatus === 'offline') {
      toast.error('Servidor offline. Não é possível buscar dados.');
      return;
    }

    if (!termo.trim()) {
      toast.error('Digite um nome ou código para buscar');
      return;
    }

    setLoadingClientData(true);
    try {
      console.log(`🔍 Buscando todos os dados para: ${termo}`);
      const response = await dataService.getAllPersonData(termo);
      
      if (response.success) {
        setClientData(response.data);
        setSelectedClient(termo);
        toast.success(`Dados encontrados para: ${termo}`);
        console.log('✅ Dados completos carregados:', response.data);
      } else {
        throw new Error(response.message || 'Nenhum dado encontrado');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados completos:', error);
      const errorMessage = error.message || 'Erro ao buscar dados completos';
      toast.error(errorMessage);
      setClientData(null);
      setSelectedClient(null);
    } finally {
      setLoadingClientData(false);
    }
  };

  // Buscar sugestões para autocomplete
  const fetchSuggestions = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const endpoint = getModuleEndpoint(module);
      const response = await dataService.getSuggestions(endpoint, term);
      
      if (response.success) {
        setSuggestions(response.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
    }
  }, [module]);

  // Handlers
  const handleSearch = () => {
    fetchData(1, searchTerm);
  };

  const handleSearchAll = () => {
    fetchAllClientData(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedClient(null);
    setClientData(null);
    setError('');
    fetchData(1, '');
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length >= 2) {
      fetchSuggestions(value);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.nome || suggestion.descricao || suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handlePageChange = (newPage) => {
    fetchData(newPage, searchTerm);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  // Renderizar detalhes em pop-up
  const renderDetailsDialog = (item) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Registro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(item).map(([key, value]) => (
            <div key={key} className="grid grid-cols-3 gap-4">
              <div className="font-medium text-sm text-gray-600 capitalize">
                {key.replace(/_/g, ' ')}:
              </div>
              <div className="col-span-2 text-sm break-words">
                {value || '-'}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Renderizar dados por cliente (quando BUSCAR TUDO é usado)
  const renderClientData = () => {
    if (!clientData) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados Completos: {selectedClient}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pessoa" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pessoa">Pessoa</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            </TabsList>
            
            {Object.entries(clientData).map(([key, items]) => (
              <TabsContent key={key} value={key} className="mt-4">
                {items && items.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      {items.length} registro(s) encontrado(s)
                    </div>
                    <div className="grid gap-4">
                      {items.map((item, index) => (
                        <Card key={index} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            {Object.entries(item).slice(0, 6).map(([field, value]) => (
                              <div key={field}>
                                <div className="font-medium text-gray-600 capitalize">
                                  {field.replace(/_/g, ' ')}
                                </div>
                                <div className="text-gray-900 break-words">
                                  {value || '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex justify-end">
                            {renderDetailsDialog(item)}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum registro encontrado para {key}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  // Renderizar tabela normal
  const renderDataTable = () => {
    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum dado encontrado</p>
        </div>
      );
    }

    const columns = Object.keys(data[0] || {});

    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.slice(0, 6).map((column) => (
                  <TableHead key={column} className="capitalize">
                    {column.replace(/_/g, ' ')}
                  </TableHead>
                ))}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  {columns.slice(0, 6).map((column) => (
                    <TableCell key={column} className="max-w-[200px]">
                      <div className="truncate" title={item[column]}>
                        {item[column] || '-'}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(item, null, 2))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {renderDetailsDialog(item)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {((pagination.currentPage - 1) * pagination.pageSize) + 1} a{' '}
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} de{' '}
              {pagination.totalRecords} registros
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm">
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Barra de busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Digite para buscar..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pr-4"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.nome || suggestion.descricao || suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                BUSCAR
              </Button>
              <Button 
                onClick={handleSearchAll} 
                disabled={loadingClientData}
                variant="secondary"
              >
                {loadingClientData ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                BUSCAR TUDO
              </Button>
              <Button onClick={handleClear} variant="outline">
                LIMPAR
              </Button>
              {serverStatus === 'offline' && (
                <Button onClick={checkServerStatus} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  RECONECTAR
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status do servidor */}
      {serverStatus === 'offline' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Servidor offline. Verifique se o backend está rodando na porta 5000.
          </AlertDescription>
        </Alert>
      )}

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resultados</span>
            <Badge variant="secondary">
              {clientData ? 'Dados Completos' : `${pagination.totalRecords || 0} registro(s) encontrado(s)`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Carregando...</span>
            </div>
          ) : clientData ? (
            renderClientData()
          ) : (
            renderDataTable()
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataViewer;

