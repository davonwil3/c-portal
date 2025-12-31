import * as React from "react"
import { cn } from "@/lib/utils"

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
}

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ReactNode
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        "flex justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface ChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  className?: string
  content?: React.ComponentType<any> | React.ReactElement
}

export function ChartTooltip({ active, payload, label, className, content }: ChartTooltipProps) {
  if (active && payload && payload.length) {
    if (content) {
      if (React.isValidElement(content)) {
        return React.cloneElement(content, { active, payload, label, className } as any)
      }
      const ContentComponent = content as React.ComponentType<any>
      return <ContentComponent active={active} payload={payload} label={label} className={className} />
    }
    
    return (
      <div className={cn("rounded-lg border bg-background p-2 shadow-md", className)}>
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {label}
              </span>
            </div>
          </div>
          {payload.map((entry, index) => (
            <div key={index} className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-[0.70rem] text-muted-foreground">
                  {entry.name}
                </span>
              </div>
              <div className="text-right font-medium">
                {entry.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export interface ChartTooltipContentProps {
  active?: boolean
  payload?: any[]
  label?: string
  className?: string
  formatter?: (value: any, name: any, props: any) => [string, string]
}

export function ChartTooltipContent({ 
  active, 
  payload, 
  label, 
  className,
  formatter 
}: ChartTooltipContentProps) {
  if (active && payload && payload.length) {
    return (
      <div className={cn("rounded-lg border bg-background p-2 shadow-md", className)}>
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {label}
              </span>
            </div>
          </div>
          {payload.map((entry, index) => {
            const [formattedValue, formattedName] = formatter 
              ? formatter(entry.value, entry.name, entry.payload)
              : [entry.value, entry.name]
            
            return (
              <div key={index} className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-[0.70rem] text-muted-foreground">
                    {formattedName}
                  </span>
                </div>
                <div className="text-right font-medium">
                  {formattedValue}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  return null
}