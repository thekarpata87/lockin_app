import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { ScreenHeader } from '../../components/ScreenHeader'
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

  return (
    <>
      <ScreenHeader title="COMIDA" />
      <Segmented label="Sección" options={TABS} value={tab} onChange={(v) => navigate(`/comida/${v}`)} />
      <Routes>
        <Route path="semana" element={<Semana />} />
        <Route path="recetas" element={<Recetas />} />
        <Route path="receta/:id" element={<Receta />} />
        <Route path="super" element={<Super />} />
        <Route path="domingo" element={<Domingo />} />
        <Route path="*" element={<Navigate to="semana" replace />} />
      </Routes>
    </>
  )
}
