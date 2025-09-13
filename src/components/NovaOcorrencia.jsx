import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, Calendar, FileText, Tag, UserCheck, Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Label } from './ui/label';
import { dataService, authService } from '../services/api';
import { toast } from 'sonner';
import '../App.css';

const NovaOcorrencia = () => {
  const [formData, setFormData] = useState({
    matricula_aluno: '',
    nome_aluno: '',
    data: '',
    descricao_novo: '',
    tipo: '',
    usuario: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tipos de ocorrência disponíveis
  const tiposOcorrencia = [
    'Disciplinar',
    'Acadêmica',
    'Financeira',
    'Administrativa',
    'Comportamental',
    'Frequência',
    'Avaliação',
    'Outros'
  ];

  // Inicializar dados do usuário e data atual
  useEffect(() => {
    const username = authService.getUsername();
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
    
    setFormData(prev => ({
      ...prev,
      usuario: username || '',
      data: formattedDate
    }));
  }, []);

  // Buscar sugestões de alunos
  const fetchSuggestions = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const result = await dataService.getSuggestions('pessoa', term);
      setSuggestions(result || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce para sugestões
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchSuggestions]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Limpar dados do aluno se o campo de busca for alterado
    if (value !== formData.nome_aluno) {
      setFormData(prev => ({
        ...prev,
        matricula_aluno: '',
        nome_aluno: ''
      }));
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.nome);
    setFormData(prev => ({
      ...prev,
      matricula_aluno: suggestion.id,
      nome_aluno: suggestion.nome
    }));
    setShowSuggestions(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar mensagens de erro/sucesso quando usuário começar a digitar
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação
    if (!formData.matricula_aluno || !formData.nome_aluno) {
      setError('Por favor, selecione um aluno válido');
      return;
    }
    
    if (!formData.descricao_novo.trim()) {
      setError('Por favor, preencha a descrição da ocorrência');
      return;
    }
    
    if (!formData.tipo) {
      setError('Por favor, selecione o tipo de ocorrência');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const result = await dataService.createOccurrence(formData);
      
      if (result.success) {
        setSuccess('Ocorrência inserida com sucesso!');
        toast.success('Ocorrência inserida com sucesso!');
        
        // Limpar formulário
        handleClear();
      } else {
        setError(result.message || 'Erro ao inserir ocorrência');
      }
    } catch (err) {
      console.error('Erro ao inserir ocorrência:', err);
      setError(err.message || 'Erro ao inserir ocorrência');
      toast.error('Erro ao inserir ocorrência');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    const username = authService.getUsername();
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
    
    setFormData({
      matricula_aluno: '',
      nome_aluno: '',
      data: formattedDate,
      descricao_novo: '',
      tipo: '',
      usuario: username || ''
    });
    
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-6">
      <Card className="tca-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 tca-primary-text" />
            <span>Nova Ocorrência</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mensagens de erro/sucesso */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Buscar Aluno */}
            <div className="space-y-2">
              <Label htmlFor="search-aluno" className="text-sm font-medium">
                Buscar Aluno
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search-aluno"
                  type="text"
                  placeholder="Digite o nome ou matrícula do aluno..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 tca-input"
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                
                {/* Sugestões */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        <div className="font-medium">{suggestion.nome}</div>
                        <div className="text-sm text-gray-500">Matrícula: {suggestion.id}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dados do Aluno */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricula" className="text-sm font-medium">
                  Matrícula
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="matricula"
                    type="text"
                    value={formData.matricula_aluno}
                    readOnly
                    className="pl-10 bg-gray-50"
                    placeholder="Matrícula será preenchida automaticamente"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium">
                  Nome do Aluno
                </Label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="nome"
                    type="text"
                    value={formData.nome_aluno}
                    readOnly
                    className="pl-10 bg-gray-50"
                    placeholder="Nome será preenchido automaticamente"
                  />
                </div>
              </div>
            </div>

            {/* Data e Hora */}
            <div className="space-y-2">
              <Label htmlFor="data" className="text-sm font-medium">
                Data e Hora da Ocorrência
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="data"
                  type="datetime-local"
                  value={formData.data.replace(' ', 'T')}
                  onChange={(e) => handleInputChange('data', e.target.value.replace('T', ' '))}
                  className="pl-10 tca-input"
                />
              </div>
            </div>

            {/* Tipo de Ocorrência */}
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-sm font-medium">
                Tipo de Ocorrência
              </Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value) => handleInputChange('tipo', value)}
              >
                <SelectTrigger className="tca-input">
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Selecione o tipo de ocorrência" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {tiposOcorrencia.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-sm font-medium">
                Descrição da Ocorrência
              </Label>
              <Textarea
                id="descricao"
                placeholder="Descreva detalhadamente a ocorrência..."
                value={formData.descricao_novo}
                onChange={(e) => handleInputChange('descricao_novo', e.target.value)}
                className="min-h-[120px] tca-input"
                rows={5}
              />
            </div>

            {/* Usuário Responsável */}
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-sm font-medium">
                Usuário Responsável
              </Label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="usuario"
                  type="text"
                  value={formData.usuario}
                  onChange={(e) => handleInputChange('usuario', e.target.value)}
                  className="pl-10 tca-input"
                  placeholder="Nome do usuário responsável"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 tca-primary-btn"
                disabled={submitting || !formData.matricula_aluno || !formData.descricao_novo.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {submitting ? 'Inserindo...' : 'INSERIR OCORRÊNCIA'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={submitting}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar Formulário
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NovaOcorrencia;

