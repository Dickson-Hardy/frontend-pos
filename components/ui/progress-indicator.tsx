'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'

interface Step {
  id: string
  title: string
  description?: string
  status: 'pending' | 'current' | 'completed' | 'error'
}

interface ProgressIndicatorProps {
  steps: Step[]
  className?: string
  orientation?: 'horizontal' | 'vertical'
  showDescriptions?: boolean
}

export function ProgressIndicator({
  steps,
  className,
  orientation = 'horizontal',
  showDescriptions = true,
}: ProgressIndicatorProps) {
  const isHorizontal = orientation === 'horizontal'

  return (
    <div className={cn(
      'flex',
      isHorizontal ? 'flex-row items-center' : 'flex-col',
      className
    )}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className={cn(
            'flex items-center',
            isHorizontal ? 'flex-col text-center' : 'flex-row',
            !isHorizontal && 'w-full'
          )}>
            {/* Step Icon */}
            <div className={cn(
              'flex items-center justify-center rounded-full border-2 transition-colors',
              step.status === 'completed' && 'bg-primary border-primary text-primary-foreground',
              step.status === 'current' && 'bg-primary/10 border-primary text-primary',
              step.status === 'pending' && 'bg-muted border-muted-foreground/30 text-muted-foreground',
              step.status === 'error' && 'bg-destructive/10 border-destructive text-destructive',
              isHorizontal ? 'h-8 w-8 mb-2' : 'h-6 w-6 mr-3 flex-shrink-0'
            )}>
              {step.status === 'completed' && <CheckCircle className="h-4 w-4" />}
              {step.status === 'current' && <Loader2 className="h-4 w-4 animate-spin" />}
              {(step.status === 'pending' || step.status === 'error') && (
                <Circle className="h-4 w-4" />
              )}
            </div>

            {/* Step Content */}
            <div className={cn(
              isHorizontal ? 'text-center' : 'flex-1 min-w-0'
            )}>
              <p className={cn(
                'text-sm font-medium',
                step.status === 'completed' && 'text-primary',
                step.status === 'current' && 'text-primary',
                step.status === 'pending' && 'text-muted-foreground',
                step.status === 'error' && 'text-destructive'
              )}>
                {step.title}
              </p>
              {showDescriptions && step.description && (
                <p className={cn(
                  'text-xs mt-1',
                  step.status === 'completed' && 'text-primary/70',
                  step.status === 'current' && 'text-primary/70',
                  step.status === 'pending' && 'text-muted-foreground/70',
                  step.status === 'error' && 'text-destructive/70'
                )}>
                  {step.description}
                </p>
              )}
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className={cn(
              'bg-border',
              isHorizontal 
                ? 'h-px flex-1 mx-4 mt-4' 
                : 'w-px h-8 ml-3 my-2',
              steps[index + 1].status === 'completed' && 'bg-primary'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Simple linear progress bar
interface LinearProgressProps {
  value: number
  max?: number
  className?: string
  showPercentage?: boolean
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

export function LinearProgress({
  value,
  max = 100,
  className,
  showPercentage = false,
  color = 'primary',
  size = 'md',
}: LinearProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-destructive',
  }

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cn(
        'w-full bg-muted rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}

// Circular progress indicator
interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
  color?: string
}

export function CircularProgress({
  value,
  max = 100,
  size = 40,
  strokeWidth = 4,
  className,
  showPercentage = false,
  color = 'hsl(var(--primary))',
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-xs font-medium">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}

// Multi-step form progress
interface FormProgressProps {
  currentStep: number
  totalSteps: number
  stepTitles?: string[]
  className?: string
}

export function FormProgress({
  currentStep,
  totalSteps,
  stepTitles,
  className,
}: FormProgressProps) {
  const steps: Step[] = Array.from({ length: totalSteps }, (_, index) => {
    const stepNumber = index + 1
    let status: Step['status'] = 'pending'
    
    if (stepNumber < currentStep) {
      status = 'completed'
    } else if (stepNumber === currentStep) {
      status = 'current'
    }

    return {
      id: `step-${stepNumber}`,
      title: stepTitles?.[index] || `Step ${stepNumber}`,
      status,
    }
  })

  return (
    <div className={className}>
      <div className="mb-4">
        <LinearProgress
          value={currentStep - 1}
          max={totalSteps - 1}
          showPercentage={false}
        />
      </div>
      <ProgressIndicator
        steps={steps}
        orientation="horizontal"
        showDescriptions={false}
      />
    </div>
  )
}