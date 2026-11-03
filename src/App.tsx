import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { AppFrame } from './components/AppFrame'
import { TabBar } from './components/TabBar'
import { ToastProvider } from './components/Toast'
import { UpdateToast } from './components/UpdateToast'
import { Casa } from './screens/Casa/Casa'
import { Comida } from './screens/Comida/Comida'
import { Gym } from './screens/Gym/Gym'
import { Hoy } from './screens/Hoy/Hoy'
import { Progreso } from './screens/Progreso/Progreso'

export function App() {
  return (
    <HashRouter>
      <ToastProvider>
      <AppFrame
        footer={
          <>
            <UpdateToast />
            <TabBar />
          </>
        }
      >
        <Routes>
          <Route path="/hoy" element={<Hoy />} />
          <Route path="/comida/*" element={<Comida />} />
          <Route path="/gym" element={<Gym />} />
          <Route path="/casa" element={<Casa />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="*" element={<Navigate to="/hoy" replace />} />
        </Routes>
      </AppFrame>
      </ToastProvider>
    </HashRouter>
  )
}
