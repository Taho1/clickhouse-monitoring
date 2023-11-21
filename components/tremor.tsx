'use client'

import React from 'react'
import {
  AreaChart as TremorAreaChart,
  BarChart as TremorBarChart,
  BarList as TremorBarList,
} from '@tremor/react'
import type {
  AreaChartProps as TremorAreaChartProps,
  BarChartProps as TremorBarChartProps,
  BarListProps as TremorBarListProps,
} from '@tremor/react'

import {
  formatReadableQuantity,
  formatReadableSize,
} from '@/lib/format-readable'

type ReadableFormat = 'size' | 'quantity'

export interface AreaChartProps extends TremorAreaChartProps {
  readable?: true | ReadableFormat
  readableColumns?: string[]
}

export function AreaChart({
  data,
  categories,
  index,
  readable,
  readableColumns,
  ...props
}: AreaChartProps) {
  let valueFormatter = undefined

  if (readable && readableColumns) {
    valueFormatter = (value: number) => {
      for (let i = 0; i < categories.length; i++) {
        // Bruteforce
        const formated = data.find((d) => d[categories[i]] === value)?.[
          readableColumns[i]
        ]

        if (formated) {
          return formated
        }
      }

      return value
    }
  } else if (readable) {
    switch (readable) {
      case 'size':
        valueFormatter = (value: number) => formatReadableSize(value, 1)
        break
      case 'quantity':
        valueFormatter = (value: number) => formatReadableQuantity(value)
        break
    }
  }

  return (
    <TremorAreaChart
      data={data}
      index={index}
      categories={categories}
      valueFormatter={valueFormatter}
      intervalType="preserveStartEnd"
      animationDuration={100}
      autoMinValue={true}
      showGridLines={false}
      startEndOnly={true}
      allowDecimals={false}
      showYAxis={false}
      {...props}
    />
  )
}

export interface BarChartProps extends TremorBarChartProps {
  readable?: ReadableFormat
  readableColumn?: string
}

export function BarChart({
  data,
  readable,
  index,
  readableColumn,
  ...props
}: BarChartProps) {
  let valueFormatter = undefined

  if (readable && readableColumn) {
    valueFormatter = (value: number) => {
      const formated = data.find((d) => d[index] === value)?.[readableColumn]

      return formated ? formated : value
    }
  }

  return (
    <TremorBarChart
      data={data}
      index={index}
      valueFormatter={valueFormatter}
      {...props}
    />
  )
}

export interface BarListProps extends TremorBarListProps {
  data: (TremorBarListProps['data'][0] & { [key: string]: any })[]
  formatedColumn?: string
}

export function BarList({ data, formatedColumn, ...props }: BarListProps) {
  let valueFormatter

  if (formatedColumn) {
    valueFormatter = (value: number) => {
      const formated = data.find((d) => d.value === value)?.[
        formatedColumn
      ] as string

      return formated ? formated : value
    }
  }

  return (
    <TremorBarList data={data} valueFormatter={valueFormatter} {...props} />
  )
}