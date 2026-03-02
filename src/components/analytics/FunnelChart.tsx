"use client";

type FunnelStep = {
  label: string
  count: number
  dropOff?: number
}

type FunnelChartProps =
  | { funnelId: string; mini?: boolean; steps?: never; title?: never; description?: never }
  | { steps: FunnelStep[]; title: string; description?: string; funnelId?: never; mini?: never }

const DATA: Record<string, { step: string; users: number }[]> = {
  'appt-booking': [
    { step: 'Landing Page',       users: 12840 },
    { step: 'Select Service',     users: 8920  },
    { step: 'Choose Date & Time', users: 5430  },
    { step: 'Confirm Booking',    users: 2350  },
  ],
  'brochure-request': [
    { step: 'Landing Page',   users: 8210 },
    { step: 'Fill Form',      users: 4100 },
    { step: 'Submit Request', users: 2594 },
  ],
  'product-enquiry': [
    { step: 'Product Page',   users: 6450 },
    { step: 'View Details',   users: 4200 },
    { step: 'Add to List',    users: 2800 },
    { step: 'Contact Form',   users: 1500 },
    { step: 'Submit Enquiry', users: 800  },
  ],
}

const STEP_COLORS = [
  "#C8924A",
  "#B87E3E",
  "#A86B32",
  "#8B5E2A",
  "#6B4A20",
  "#4A3214",
]

export function FunnelChart(props: FunnelChartProps) {
  // Normalise to a common shape
  const isDirectSteps = 'steps' in props && props.steps !== undefined

  const title = isDirectSteps
    ? props.title
    : (props.funnelId ?? '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const description = isDirectSteps
    ? (props.description ?? 'Conversion path from entry to goal')
    : 'Conversion path from entry to goal'

  const steps = isDirectSteps
    ? props.steps.map((s) => ({ step: s.label, users: s.count }))
    : (DATA[props.funnelId ?? ''] ?? [])

  const mini = !isDirectSteps && (props.mini ?? false)
  const maxUsers = steps.length > 0 ? steps[0]!.users : 1

  if (mini) {
    return (
      <div className="flex flex-col gap-1">
        {steps.map((s, i) => {
          const pct   = Math.round((s.users / maxUsers) * 100)
          const color = STEP_COLORS[i] ?? STEP_COLORS[STEP_COLORS.length - 1]
          return (
            <div key={s.step} className="h-[6px] w-full bg-[#F0EDE8] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-5">
      <div className="mb-5">
        <h3 className="text-[14px] font-semibold text-[#E8D5B7]">{title}</h3>
        <p className="text-[12px] text-[#5A4232] mt-0.5">{description}</p>
      </div>

      <div className="flex flex-col gap-2">
        {steps.map((s, i) => {
          const pct               = (s.users / maxUsers) * 100
          const conversionFromTop = pct.toFixed(1)
          const color             = STEP_COLORS[i] ?? STEP_COLORS[STEP_COLORS.length - 1]
          const prev              = steps[i - 1]
          const dropoff           = i > 0 && prev ? Math.round((1 - s.users / prev.users) * 100) : null

          return (
            <div key={s.step} className="group">
              {dropoff !== null && (
                <div className="flex items-center gap-2 mb-1 pl-2">
                  <div className="w-px h-3 bg-[#2E231A]" />
                  <span className="text-[10.5px] text-red-400 font-medium">
                    ↓ {dropoff}% drop-off
                  </span>
                </div>
              )}

              <div className="relative flex items-center gap-3">
                <span className="shrink-0 text-[10px] font-bold text-[#3D2E1E] w-4 text-right">
                  {i + 1}
                </span>

                <div className="flex-1 relative h-10 bg-[#2E231A] rounded-[8px] overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-[8px] transition-all duration-700 flex items-center"
                    style={{ width: `${pct}%`, background: color }}
                  >
                    {pct > 40 && (
                      <span className="ml-3 text-[11px] font-medium text-white/90 truncate">
                        {s.step}
                      </span>
                    )}
                  </div>

                  {pct <= 40 && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#7A6045] truncate"
                      style={{ left: `calc(${pct}% + 8px)` }}
                    >
                      {s.step}
                    </span>
                  )}
                </div>

                <div className="shrink-0 text-right min-w-[80px]">
                  <p className="text-[13px] font-bold text-[#E8D5B7] leading-none">
                    {s.users.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#5A4232] leading-none mt-0.5">
                    {conversionFromTop}% of total
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-[#2E231A] flex items-center justify-between">
        <div>
          <p className="text-[11px] text-[#5A4232]">Overall conversion</p>
          <p className="text-[18px] font-bold text-[#C8924A]">
            {(((steps[steps.length - 1]?.users ?? 0) / maxUsers) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#5A4232]">Completed</p>
          <p className="text-[18px] font-bold text-[#E8D5B7]">
            {(steps[steps.length - 1]?.users ?? 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}