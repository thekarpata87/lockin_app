import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { AppFrame } from './components/AppFrame'
import { TabBar } from './components/TabBar'
import { ToastProvider } from './components/Toast'
import { UpdateToast } from './components/UpdateToast'
import { Gym } from './screens/Gym/Gym'
import { Hoy } from './screens/Hoy/Hoy'
import { Placeholder } from './screens/Placeholder'

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
          <Route path="/comida" element={<Placeholder title="COMIDA" milestone="M6" />} />
          <Route path="/gym" element={<Gym />} />
          <Route path="/casa" element={<Placeholder title="CASA" milestone="M5" />} />
          <Route path="/progreso" element={<Placeholder title="PROGRESO" milestone="M7" />} />
          <Route path="*" element={<Navigate to="/hoy" replace />} />
        </Routes>
      </AppFrame>
      </ToastProvider>
    </HashRouter>
  )
}
