import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { useEffect } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Slide } from '../../components/Slide'
import { Segmented } from '../../components/Segmented'
import { Domingo } from './Domingo'
import { Receta } from './Receta'
import { Recetas } from './Recetas'
import { Semana } from './Semana'
import { Super } from './Super'

type Tab = 'semana' | 'recetas' | 'super' | 'domingo'
const TABS: { value: Tab; label: string }[] = [
  { value: 'semana', label: 'Semana' },
  { value: 'recetas', label: 'Recetas' },
  { value: 'super', label: 'Súper' },
  { value: 'domingo', label: 'Domingo' },
]

export function Comida() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const seg = pathname.split('/')[2] ?? 'semana'
  const tab: Tab = seg === 'receta' ? 'recetas' : ((TABS.find((t) => t.value === seg)?.value ?? 'semana') as Tab)
  const isDetail = seg === 'receta'
  // Recetas 1, a recipe 1.5 (drill-in), so coming back slides from the left.
  const pos = isDetail ? 1.5 : TABS.findIndex((t) => t.value === tab)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <ScreenHeader title="COMIDA" />
      <Segmented label="Sección" options={TABS} value={tab} onChange={(v) => navigate(`/comida/${v}`)} />
      <Slide id={pathname} pos={pos} variant={isDetail ? 'push' : 'slide'}>
      <Routes>
        <Route path="semana" element={<Semana />} />
        <Route path="recetas" element={<Recetas />} />
        <Route path="receta/:id" element={<Receta />} />
        <Route path="super" element={<Super />} />
        <Route path="domingo" element={<Domingo />} />
        <Route path="*" element={<Navigate to="semana" replace />} />
      </Routes>
      </Slide>
    </>
  )
}
