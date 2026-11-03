import { Segmented } from '../../components/Segmented'
import { setWeekChoice, useWeekChoice, weekRangeLabel, weekStartFor } from './week'

export function WeekToggle() {
  const c = useWeekChoice()
  return (
    <Segmented
      label="Semana"
      options={[
        { value: 'this', label: `Esta · ${weekRangeLabel(weekStartFor('this'))}` },
        { value: 'next', label: `Próxima · ${weekRangeLabel(weekStartFor('next'))}` },
      ]}
      value={c}
      onChange={setWeekChoice}
    />
  )
}
