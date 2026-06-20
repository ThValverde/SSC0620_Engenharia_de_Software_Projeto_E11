import './App.css'

function App() {
  return (
    <div className="dashboard-layout">
      
      {/* MENU LATERAL ESQUERDO */}
      <aside className="sidebar">
        <h2>Observatório de Turismo</h2>
        <p>Olímpia — SP</p>
        <hr style={{ borderColor: '#1E3A5F', margin: '20px 0' }} />
        {/* Aqui depois vamos colocar os botões do menu */}
        <p>Dashboard Inicial</p>
        <p>Inventário Turístico</p>
      </aside>

      {/* CONTEÚDO PRINCIPAL (CENTRO) */}
      <main className="main-content">
        <h1>Dashboard Inicial</h1>
        <p>Visão consolidada do Inventário Turístico de Olímpia — SP</p>
        {/* Aqui depois vamos criar os blocos azuis e brancos com os números */}
      </main>

      {/* PAINEL DIREITO */}
      <aside className="right-panel">
        <h3>Atividades Recentes</h3>
        {/* Aqui depois vamos colocar a lista de ações */}
      </aside>

    </div>
  )
}

export default App