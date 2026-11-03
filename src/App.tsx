import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { Slide } from './components/Slide'
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
        <TabSlide>
        <Routes>
          <Route path="/hoy" element={<Hoy />} />
          <Route path="/comida/*" element={<Comida />} />
          <Route path="/gym" element={<Gym />} />
          <Route path="/casa" element={<Casa />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="*" element={<Navigate to="/hoy" replace />} />
        </Routes>
        </TabSlide>
      </AppFrame>
      </ToastProvider>
    </HashRouter>
  )
}

const TAB_ORDER = ['hoy', 'comida', 'gym', 'casa', 'progreso']

/** Top-level tabs slide sideways in tab-bar order; each tab starts at the top. */
function TabSlide({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const tab = pathname.split('/')[1] || 'hoy'
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])
  return (
    <Slide id={tab} pos={TAB_ORDER.indexOf(tab)}>
      {children}
    </Slide>
  )
}
