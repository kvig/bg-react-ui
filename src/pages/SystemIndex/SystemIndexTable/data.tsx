import useAxios from 'axios-hooks'
import { useEffect, useMemo, useState } from 'react'
import { Column } from 'react-table'
import { System } from '../../../types/custom_types'
import ExploreButton from '../ExploreButton'
import { ServerConfigContainer } from '../../../containers/ConfigContainer'

export type SystemIndexTableData = {
  namespace: string
  name: string
  version: string
  description: string
  commandCount: number
  instanceCount: number
  exploreButton: JSX.Element
}

const systemMapper = (system: System): SystemIndexTableData => {
  return {
    namespace: system.namespace,
    name: system.name,
    version: system.version,
    description: system.description,
    commandCount: system.commands.length,
    instanceCount: system.instances.length,
    exploreButton: ExploreButton(system),
  }
}

const useSystems = () => {
  const { authEnabled } = ServerConfigContainer.useContainer()
  const [systems, setSystems] = useState<SystemIndexTableData[]>([])
  const [{ data, error }] = useAxios({
    url: '/api/v1/systems',
    method: 'GET',
    withCredentials: authEnabled(),
  })

  useEffect(() => {
    if (data && !error) {
      setSystems(data.map(systemMapper))
    }
  }, [data, error])

  return systems
}

const useSystemIndexTableColumns = () => {
  return useMemo<Column<SystemIndexTableData>[]>(
    () => [
      {
        Header: 'Plugin',
        columns: [
          {
            Header: 'Namespace',
            accessor: 'namespace',
            width: 150,
          },
          {
            Header: 'System',
            accessor: 'name',
            filter: 'fuzzyText',
            width: 120,
          },
          {
            Header: 'Version',
            accessor: 'version',
            width: 120,
          },
        ],
      },
      {
        Header: 'Details',
        columns: [
          {
            Header: 'Description',
            accessor: 'description',
            filter: 'fuzzyText',
            minWidth: 200,
            width: 300,
            disableSortBy: true,
          },
          {
            Header: 'Commands',
            accessor: 'commandCount',
            width: 100,
            minWidth: 100,
            maxWidth: 180,
            disableSortBy: true,
            disableFilters: true,
          },
          {
            Header: 'Instances',
            accessor: 'instanceCount',
            width: 90,
            minWidth: 90,
            maxWidth: 180,
            disableSortBy: true,
            disableGroupBy: true,
            disableFilters: true,
          },
          {
            Header: '',
            accessor: 'exploreButton',
            disableSortBy: true,
            disableGroupBy: true,
            disableFilters: true,
            canHide: false,
            width: 120,
            midWidth: 90,
          },
        ],
      },
    ],
    [],
  )
}

export { useSystems, useSystemIndexTableColumns }
