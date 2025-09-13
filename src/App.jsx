import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { authService } from './services/api';
import './App.css';

// Componente para proteger rotas que precisam de autenticação
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Componente para redirecionar usuários já autenticados
const PublicRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Rota raiz - redirecionar baseado na autenticação */}
          <Route 
            path="/" 
            element={
              authService.isAuthenticated() ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          {/* Rota de login - apenas para usuários não autenticados */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          {/* Rota do dashboard - apenas para usuários autenticados */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Rota 404 - redirecionar para a página apropriada */}
          <Route 
            path="*" 
            element={
              authService.isAuthenticated() ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
            } 
          />
        </Routes>
        
        {/* Componente de notificações toast */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              color: '#374151',
              border: '1px solid #e5e7eb',
            },
            success: {
              style: {
                border: '1px solid #10b981',
                color: '#065f46',
              },
            },
            error: {
              style: {
                border: '1px solid #ef4444',
                color: '#991b1b',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
