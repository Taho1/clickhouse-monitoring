import { ErrorAlert } from '@/components/error-alert'
import { TruncatedList } from '@/components/truncated-list'
import { TruncatedParagraph } from '@/components/truncated-paragraph'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { fetchData } from '@/lib/clickhouse'
import { formatQuery } from '@/lib/format-readable'
import { getScopedLink } from '@/lib/scoped-link'
import { dedent } from '@/lib/utils'
import { QueryConfig } from '@/types/query-config'
import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import { type RowData } from './config'
import { PageProps } from './types'

export async function QueryDetail({
  queryConfig,
  params,
}: {
  queryConfig: QueryConfig
  params: Awaited<PageProps['params']>
}) {
  try {
    const queryParams = {
      ...queryConfig.defaultParams,
      ...params,
    }
    const { data, metadata } = await fetchData<RowData[]>({
      query: queryConfig.sql,
      format: 'JSONEachRow',
      query_params: queryParams,
      clickhouse_settings: {
        ...queryConfig.clickhouseSettings,
      },
    })

    if (!data.length) {
      return 'No data'
    }

    const { query_id, query, user } = data[0]
    const finalType = data[data.length - 1].type
    const query_duration_ms = data
      .map((row) => parseInt(row.duration_ms))
      .reduce((a, b) => a + b, 0)

    // Details
    const {
      hostname,
      client_hostname,
      client_name,
      client_revision,
      initial_user,
      initial_query_id,
      initial_address,
      initial_port,
      initial_query_start_time,
      databases,
      tables,
      columns,
      partitions,
      projections,
      views,
      exception_code,
      exception,
      stack_trace,
      http_method,
      http_user_agent,
      http_referer,
      forwarded_for,
      quota_key,
      distributed_depth,
      revision,
      log_comment,
      ProfileEvents,
      Settings,
      used_aggregate_functions,
      used_aggregate_function_combinators,
      used_database_engines,
      used_data_type_families,
      used_dictionaries,
      used_formats,
      used_functions,
      used_storages,
      used_table_functions,
      used_row_policies,
      used_privileges,
      missing_privileges,
    } = data.find((row) => row.type == 'QueryFinish') || data[0]

    return (
      <div>
        <h3 className="flex items-center text-lg font-medium">
          {query_id}
          <Badge className="ml-2" variant="outline" title="Query Duration (ms)">
            {query_duration_ms} ms
          </Badge>
          <Badge className="ml-2" variant="outline" title="Query Type">
            {finalType || 'Unknown'}
          </Badge>
          <Badge className="ml-2" variant="outline" title="User">
            {user || 'Unknown'}
          </Badge>
        </h3>

        <div className="my-3">
          <Accordion
            type="single"
            collapsible
            className="w-full rounded-lg bg-gray-100"
          >
            <AccordionItem value="query" className="border-none">
              <AccordionTrigger className="w-full items-start justify-start p-3 hover:no-underline">
                <div className="w-full truncate text-left">
                  <code className="truncate">
                    {formatQuery({
                      query,
                      comment_remove: true,
                      trim: true,
                      truncate: 100,
                    })}
                  </code>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-3">
                <pre>{dedent(formatQuery({ query, trim: false }))}</pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {(
            [
              ['Host name', hostname],
              ['Client host name', client_hostname],
              ['Client name', client_name],
              ['Client revision', client_revision],
              [
                'Initial user',
                initial_user ? (
                  <Link
                    className="flex flex-row items-center gap-1"
                    href={await getScopedLink(
                      `/history-queries?user=${initial_user}`
                    )}
                    target="_blank"
                    key="initial_user"
                  >
                    {initial_user}
                    <ExternalLinkIcon className="size-3" />
                  </Link>
                ) : (
                  ''
                ),
              ],
              [
                'Initial query id',
                <Link
                  className="flex flex-row items-center gap-1"
                  href={await getScopedLink(`/query/${initial_query_id}`)}
                  target="_blank"
                  key="initial_query_id"
                >
                  {initial_query_id}
                  <ExternalLinkIcon className="size-3" />
                </Link>,
              ],
              ['Initial address', initial_address],
              ['Initial port', initial_port],
              ['Initial query start time', initial_query_start_time],
              ['Databases', bindingDatabaseLink(databases)],
              ['Tables', bindingTableLink(tables)],
              ['Columns', JSON.stringify(columns, null, 2)],
              ['Partitions', JSON.stringify(partitions, null, 2)],
              ['Projections', JSON.stringify(projections, null, 2)],
              ['Views', JSON.stringify(views, null, 2)],
              ['Exception code', exception_code],
              ['Exception', exception],
              ['Stack trace', stack_trace],
              ['HTTP method', http_method],
              ['HTTP user agent', http_user_agent],
              ['HTTP referer', http_referer],
              ['Forwarded for', forwarded_for],
              ['Quota key', quota_key],
              ['Distributed depth', distributed_depth],
              ['Revision', revision],
              ['Log Comment', log_comment],
              [
                {
                  key: 'Profile events',
                  link: 'https://clickhouse.com/docs/en/operations/system-tables/metrics',
                },
                JSON.stringify(ProfileEvents, null, 2),
              ],
              [
                {
                  key: 'Settings',
                  link: 'https://clickhouse.com/docs/en/operations/server-configuration-parameters/settings',
                },
                JSON.stringify(Settings, null, 2),
              ],
              [
                'Used aggregate functions',
                bindingReference(used_aggregate_functions),
              ],
              [
                'Used aggregate function combinators',
                JSON.stringify(used_aggregate_function_combinators, null, 2),
              ],
              [
                {
                  key: 'Used database engines',
                  link: 'https://clickhouse.com/docs/en/chdb/data-formats',
                },
                JSON.stringify(used_database_engines, null, 2),
              ],
              [
                'Used data type families',
                JSON.stringify(used_data_type_families, null, 2),
              ],
              ['Used dictionaries', JSON.stringify(used_dictionaries, null, 2)],
              [
                {
                  key: 'Used formats',
                  link: 'https://clickhouse.com/docs/en/chdb/data-formats',
                },
                JSON.stringify(used_formats, null, 2),
              ],
              ['Used functions', bindingReference(used_functions)],
              ['Used storages', JSON.stringify(used_storages, null, 2)],
              [
                'Used table functions',
                JSON.stringify(used_table_functions, null, 2),
              ],
              ['Used row policies', JSON.stringify(used_row_policies, null, 2)],
              ['Used privileges', JSON.stringify(used_privileges, null, 2)],
              [
                'Missing privileges',
                JSON.stringify(missing_privileges, null, 2),
              ],
            ] as Array<
              | [string, string | React.ReactNode[]]
              | [{ key: string; link: string }, string | React.ReactNode[]]
            >
          )
            .filter(
              ([_, value]) =>
                (Array.isArray(value) && value.length) ||
                (!!value && value !== '[]' && value !== '{}')
            )
            .map(([key, value]) => (
              <div
                className="mt-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground"
                key={typeof key === 'string' ? key : key.key}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {typeof key === 'string' ? (
                      key
                    ) : (
                      <Link
                        href={key.link}
                        target="_blank"
                        className="flex gap-1"
                      >
                        {key.key} <ExternalLinkIcon className="size-3" />
                      </Link>
                    )}
                  </p>
                  {typeof value === 'string' ? (
                    <TruncatedParagraph className="text-sm text-muted-foreground">
                      {value}
                    </TruncatedParagraph>
                  ) : (
                    <div className="flex flex-col flex-wrap gap-1 text-sm text-muted-foreground">
                      <TruncatedList>{value}</TruncatedList>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    )
  } catch (error) {
    return (
      <ErrorAlert
        title="ClickHouse Query Error"
        message={`${error}`}
        query={queryConfig.sql}
        docs={queryConfig.docs}
      />
    )
  }
}

function bindingDatabaseLink(databases: Array<string>): React.ReactNode[] {
  return databases.map(async (database) => {
    return (
      <Link
        className="flex flex-row items-center gap-1"
        key={database}
        href={await getScopedLink(`/database/${database}`)}
      >
        {database} <ExternalLinkIcon className="size-3" />
      </Link>
    )
  })
}

function bindingTableLink(tables: Array<string>): React.ReactNode[] {
  return tables.map(async (databaseTable) => {
    const [database, table] = databaseTable.split('.')
    return (
      <Link
        className="flex flex-row items-center gap-1"
        key={databaseTable}
        href={await getScopedLink(`/database/${database}/${table}`)}
      >
        {databaseTable} <ExternalLinkIcon className="size-3" />
      </Link>
    )
  })
}

function bindingReference(value: Array<string>): React.ReactNode[] {
  console.log('used_functionsused_functionsused_functions', value)

  const getSearchLink = (item: string) => {
    const searchParams = new URLSearchParams({
      q: `repo:ClickHouse/ClickHouse path:docs/en/sql-reference path:*.md "# ${item}"`,
    })
    let url = new URL(`https://github.com/search`)
    url.search = searchParams.toString()

    return url.toString()
  }

  return value.map((item) => {
    return (
      <Link
        className="flex flex-row items-center gap-1"
        key={item}
        href={getSearchLink(item)}
        target="_blank"
      >
        {item} <ExternalLinkIcon className="size-3" />
      </Link>
    )
  })
}
