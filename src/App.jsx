import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Clientes from './pages/Clientes'
import Contactos from './pages/Contactos'
import Ventas from './pages/Ventas'
import RealizarVenta from './pages/RealizarVenta'
import AnularDevolverVenta from './pages/AnularDevolverVenta'
import Correo from './pages/Correo'
import ConfiguracionCorreo from './pages/ConfiguracionCorreo'
import Tareas from './pages/Tareas'
import Reportes from './pages/Reportes'
import Marketing from './pages/Marketing'
import ConfiguracionMarketing from './pages/ConfiguracionMarketing'

function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/productos" element={<Productos />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/contactos" element={<Contactos />} />
              <Route path="/correo" element={<Correo />} />
              <Route path="/correo/configuracion" element={<ConfiguracionCorreo />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/ventas/realizar" element={<RealizarVenta />} />
              <Route path="/ventas/anular-devolver" element={<AnularDevolverVenta />} />
              <Route path="/tareas" element={<Tareas />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/marketing/configuracion" element={<ConfiguracionMarketing />} />
              <Route path="/marketing/callback" element={<ConfiguracionMarketing />} />
            </Routes>
          </Layout>
        </Router>
      </CurrencyProvider>
    </ThemeProvider>
  )
}

export default App

