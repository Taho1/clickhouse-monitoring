import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

export const runningQueriesConfig: QueryConfig = {
  name: 'running-queries',
  sql: `
      SELECT *,
        query_id as query_detail,
        multiIf (elapsed < 30, format('{} seconds', round(elapsed, 1)),
                 elapsed < 90, 'a minute',
                 formatReadableTimeDelta(elapsed, 'days', 'minutes')) as readable_elapsed,
        round(100 * elapsed / max(elapsed) OVER ()) AS pct_elapsed,
        formatReadableQuantity(read_rows) as readable_read_rows,
        round(100 * read_rows / max(read_rows) OVER ()) AS pct_read_rows,
        formatReadableQuantity(written_rows) as readable_written_rows,
        round(100 * written_rows / max(written_rows) OVER ()) AS pct_written_rows,
        formatReadableQuantity(total_rows_approx) as readable_total_rows_approx,
        formatReadableSize(peak_memory_usage) as readable_peak_memory_usage,
        multiIf (
          memory_usage = 0, formatReadableSize(memory_usage),
          formatReadableSize(memory_usage) = formatReadableSize(peak_memory_usage), formatReadableSize(memory_usage),
          formatReadableSize(memory_usage) || ' (peak ' || readable_peak_memory_usage || ')'
        ) as readable_memory_usage,
        round(100 * memory_usage / max(memory_usage) OVER ()) AS pct_memory_usage,
        if(total_rows_approx > 0 AND query_kind = 'Select', toString(round((100 * read_rows) / total_rows_approx, 2)) || '%', '') AS progress,
        if(total_rows_approx > 0 AND query_kind = 'Select', round((100 * read_rows) / total_rows_approx, 2), 0) AS pct_progress,
        (elapsed / (read_rows / total_rows_approx)) * (1 - (read_rows / total_rows_approx)) AS estimated_remaining_time,
        formatReadableQuantity(ProfileEvents['Merge']) AS launched_merges,
        formatReadableQuantity(ProfileEvents['MergedRows']) AS rows_before_merge,
        formatReadableSize(ProfileEvents['MergedUncompressedBytes']) AS bytes_before_merge,
        formatReadableTimeDelta(ProfileEvents['MergesTimeMilliseconds'] / 1000, 'days', 'minutes') AS merges_time,
        formatReadableTimeDelta(ProfileEvents['PartsLockHoldMicroseconds'] / 1000 / 1000) AS parts_lock_hold,
        ProfileEvents['FileOpen'] AS file_open,
        ProfileEvents['ContextLock'] AS context_lock,
        ProfileEvents['RWLockAcquiredReadLocks'] AS rw_lock_acquired_read_locks
      FROM system.processes
      WHERE is_cancelled = 0
      ORDER BY elapsed
    `,
  columns: [
    'query',
    'query_detail',
    'user',
    'readable_memory_usage',
    'readable_elapsed',
    'progress',
    'readable_read_rows',
    'readable_written_rows',
    'launched_merges',
    'rows_before_merge',
    'bytes_before_merge',
    'merges_time',
    'file_open',
    'parts_lock_hold',
    'context_lock',
    'rw_lock_acquired_read_locks',
    'query_id',
  ],
  columnFormats: {
    query: [
      ColumnFormat.CodeDialog,
      {
        max_truncate: 100,
        hide_query_comment: true,
        dialog_title: 'Running Query',
        trigger_classname: 'min-w-96',
      },
    ],
    user: ColumnFormat.ColoredBadge,
    estimated_remaining_time: ColumnFormat.Duration,
    query_detail: [
      ColumnFormat.Link,
      {
        href: '/[ctx.hostId]/query/[query_id]',
        className: 'truncate max-w-48 text-wrap',
        title: 'Query Detail',
      },
    ],
    query_id: [
      ColumnFormat.Action,
      ['kill-query', 'explain-query', 'query-settings'],
    ],
    readable_elapsed: ColumnFormat.BackgroundBar,
    readable_read_rows: ColumnFormat.BackgroundBar,
    readable_written_rows: ColumnFormat.BackgroundBar,
    readable_memory_usage: ColumnFormat.BackgroundBar,
    progress: ColumnFormat.BackgroundBar,
    file_open: ColumnFormat.Number,
  },
  relatedCharts: [
    [
      'query-count',
      {
        title: 'Total Running Queries over last 12 hours (query / 5 minutes)',
        interval: 'toStartOfFiveMinutes',
        lastHours: 12,
      },
    ],
    [
      'query-count-by-user',
      {
        title: 'Total Queries over last 14 days by users',
        interval: 'toStartOfDay',
        lastHours: 24 * 14,
        showLegend: false,
      },
    ],
    [
      'summary-used-by-running-queries',
      {
        title: 'Running queries Summary',
      },
    ],
    [
      'summary-used-by-merges',
      {
        title: 'Merge Summary',
      },
    ],
  ],
}
