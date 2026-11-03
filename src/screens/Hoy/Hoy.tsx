import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ScreenHeader } from '../../components/ScreenHeader'
import { RECIPE_BY_ID } from '../../data/recipes'
import type { MealKey } from '../../data/types'
import { getBodyMetric, latestBodyMetric } from '../../db/repo/bodyMetrics'
import { getDailyLog, listDailyLogs } from '../../db/repo/dailyLogs'
import { getSettings } from '../../db/repo/settings'
import { getWeeklyPlan } from '../../db/repo/weeklyPlans'
import { useClock } from '../../hooks/useClock'
import { dayProgress } from '../../lib/blocks'
import { addDays, dayKeyOf, planDay, weekStartOf } from '../../lib/dates'
import { nowItem, rampStep, scheduleFor } from '../../lib/now'
import { flexUsedOtherDay, mealRecipeId } from '../../lib/today'
import { Habits } from './Habits'
import { HeroStats } from './HeroStats'
import { Meals } from './Meals'
import { NowRow } from './NowRow'
import { Water } from './Water'
import styles from './Hoy.module.css'

const CELEBRATE_MS = 400

export function Hoy() {
  const { date, time } = useClock()
  const dayKey = dayKeyOf(date)
  const weekStart = weekStartOf(date)

  const settings = useLiveQuery(getSettings)
  const log = useLiveQuery(() => getDailyLog(date), [date])
  const metric = useLiveQuery(() => getBodyMetric(date), [date])
  const latest = useLiveQuery(latestBodyMetric)
  const week = useLiveQuery(() => getWeeklyPlan(weekStart), [weekStart])
  const weekLogs = useLiveQuery(() => listDailyLogs(weekStart, addDays(weekStart, 6)), [weekStart])

  const plan = week?.plan
  const recipeFor = (m: MealKey) => mealRecipeId(log, plan, dayKey, m)
  const plannedFor = (m: MealKey) => mealRecipeId(undefined, plan, dayKey, m)

  const progress = dayProgress(log?.meals ?? {})
  const celebrating = useCelebrate(progress.complete, log !== undefined)

  if (!settings) return <ScreenHeader title="HOY" />

  const ramp = rampStep(settings, date)
  const sleepTime = ramp?.sleep ?? settings.sleepTime
  const items = scheduleFor(dayKey, date, settings)

  return (
    <>
      <ScreenHeader title="HOY" />
      <HeroStats
        date={date}
        planDay={settings.startDate ? planDay(settings.startDate, date) : null}
        today={metric}
        latest={latest}
        celebrating={celebrating}
        dayComplete={progress.complete}
      />
      <NowRow
        item={nowItem(items, time)}
        mealDetail={(m) => (m === 'pre' ? 'Fruta + creatina' : RECIPE_BY_ID.get(recipeFor(m) ?? '')?.name ?? 'Armar con bloques')}
      />
      <Meals date={date} log={log} recipeFor={recipeFor} plannedFor={plannedFor} />
      <Water date={date} ml={log?.waterMl ?? 0} />
      <Habits
        date={date}
        dayKey={dayKey}
        log={log}
        sleepTime={sleepTime}
        creatineG={settings.creatineG}
        flexOtherDay={flexUsedOtherDay(weekLogs ?? [], date)}
      />
      <p className={styles.version}>Versión {__APP_VERSION__}</p>
    </>
  )
}

/** The one orchestrated moment (DESIGN §8): 400 ms when the day's blocks become complete. */
function useCelebrate(complete: boolean, loaded: boolean) {
  const prev = useRef<boolean | null>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!loaded) return
    if (prev.current === false && complete) {
      setOn(true)
      const t = window.setTimeout(() => setOn(false), CELEBRATE_MS)
      prev.current = complete
      return () => window.clearTimeout(t)
    }
    prev.current = complete
  }, [complete, loaded])
  return on
}
