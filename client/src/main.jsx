import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

class RecoveryBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('Falha ao renderizar o painel:', error); }
  render() {
    return this.state.failed ? <div className="boot-message" role="alert"><h1>O painel encontrou um erro</h1><p>Recarregue a página. Se persistir, execute atualizar-painel-windows.bat e reinicie o servidor.</p><button onClick={() => location.reload()}>Recarregar painel</button></div> : this.props.children;
  }
}
import('./App.jsx').then(({ default: App }) => {
  createRoot(document.getElementById('root')).render(<React.StrictMode><RecoveryBoundary><App /></RecoveryBoundary></React.StrictMode>);
}).catch(error => {
  console.error('Falha ao carregar o painel:', error);
  document.getElementById('root').textContent = 'Não foi possível carregar o painel. Pressione Ctrl+F5. Se persistir, execute atualizar-painel-windows.bat e reinicie a aplicação.';
});
