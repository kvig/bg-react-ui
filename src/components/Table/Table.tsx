import { KeyboardArrowUp } from '@mui/icons-material'
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight'
import { Box, TableSortLabel, Tooltip } from '@mui/material'
import {
  CSSProperties,
  Fragment,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
} from 'react'
import {
  Column,
  TableOptions,
  TableState,
  useColumnOrder,
  useExpanded,
  useFilters,
  useFlexLayout,
  useGroupBy,
  usePagination,
  useResizeColumns,
  useRowSelect,
  useSortBy,
  useTable,
} from 'react-table'
import { FilterChipBar } from './chipbar/FilterChipBar'
import ColumnResizeHandle from './ColumnResizeHandle'
import {
  DefaultCellRenderer,
  DefaultColumnFilter,
  defaultColumnValues,
  DefaultHeader,
} from './defaults'
import { fuzzyTextFilter, numericTextFilter } from './filters'
import { TablePagination } from './pagination'
import { useDebounce, useLocalStorage } from './table-hooks'
import {
  Table as StyledTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableHeadRow,
  TableLabel,
  TableRow,
} from './TableComponentsStyled'
import { Toolbar } from './toolbar'

export type TableData = Record<string, unknown>

const filterTypes = {
  fuzzyText: fuzzyTextFilter,
  numeric: numericTextFilter,
}

const defaultColumn = {
  Filter: DefaultColumnFilter,
  Cell: DefaultCellRenderer,
  Header: DefaultHeader,
  ...defaultColumnValues,
}

const hooks = [
  useColumnOrder,
  useFilters,
  useGroupBy,
  useSortBy,
  useExpanded,
  useFlexLayout,
  usePagination,
  useResizeColumns,
  useRowSelect,
]

interface TableProps<T extends TableData> extends TableOptions<T> {
  tableName: string
  data: T[]
  columns: Column<T>[]
}

const DEBUG_INITIAL_STATE = false

const Table = <T extends TableData>(
  props: PropsWithChildren<TableProps<T>>,
): ReactElement => {
  const { tableName, data, columns, ...childProps } = props
  const [initialState, _setInitialState] = useLocalStorage(
    `tableState:${tableName}`,
    {} as Partial<TableState<T>>,
  )

  const setInitialState = useCallback(
    (initialState: Partial<TableState<T>>) => {
      if (DEBUG_INITIAL_STATE) {
        console.log('Setting initial state:', initialState)
      }

      _setInitialState(initialState)
    },
    [_setInitialState],
  )

  const instance = useTable<T>(
    {
      data,
      columns,
      filterTypes,
      defaultColumn,
      initialState,
      disableSortRemove: true,
    },
    ...hooks,
  )
  const {
    getTableProps,
    headerGroups,
    getTableBodyProps,
    page,
    prepareRow,
    state,
  } = instance

  const debouncedState = useDebounce(state, 500)

  useEffect(() => {
    const { filters, pageSize, hiddenColumns } = debouncedState
    let { sortBy } = debouncedState

    if (sortBy.length === 0 && columns) {
      let id, accessor
      const firstColumn = columns[0]

      if (firstColumn) {
        if ('columns' in firstColumn) {
          id = firstColumn.columns[0].id
          accessor = firstColumn.columns[0].accessor
        } else {
          id = firstColumn.id
          accessor = firstColumn.accessor
        }
      }
      if (id) {
        sortBy = [{ id: id }]
      } else if (accessor && typeof accessor === 'string') {
        sortBy = [{ id: accessor }]
      }
    }

    setInitialState({
      sortBy,
      filters,
      pageSize,
      hiddenColumns,
    })
  }, [setInitialState, debouncedState, columns])

  const { role: tableRole, ...tableProps } = getTableProps()

  return (
    <Fragment>
      <Toolbar name={tableName} instance={instance} />
      <FilterChipBar<T> instance={instance} />

      <Box {...childProps}>{props.children}</Box>

      <StyledTable {...tableProps}>
        <TableHead>
          {headerGroups.map((headerGroup) => {
            const {
              key: headerGroupKey,
              role: headerGroupRole,
              ...headerGroupProps
            } = headerGroup.getHeaderGroupProps()

            return (
              <TableHeadRow key={headerGroupKey} {...headerGroupProps}>
                {headerGroup.headers.map((column) => {
                  const style = {
                    textAlign: column.align ? column.align : 'left',
                  } as CSSProperties
                  const {
                    key: headerKey,
                    role: headerRole,
                    ...headerProps
                  } = column.getHeaderProps()
                  const { title: sortTitle = '', ...columnSortByProps } =
                    column.getSortByToggleProps()
                  const { title: groupTitle = '', ...columnGroupByProps } =
                    column.getGroupByToggleProps()
                  return (
                    <TableHeadCell key={headerKey} {...headerProps}>
                      {column.canGroupBy && (
                        <Tooltip title={groupTitle}>
                          <TableSortLabel
                            active
                            direction={column.isGrouped ? 'desc' : 'asc'}
                            IconComponent={KeyboardArrowRight}
                            {...columnGroupByProps}
                            sx={{
                              '& svg': {
                                width: 16,
                                height: 16,
                                marginTop: 1,
                                marginRight: 0,
                              },
                            }}
                          />
                        </Tooltip>
                      )}
                      {column.canSort ? (
                        <Tooltip title={sortTitle}>
                          <TableSortLabel
                            active={column.isSorted}
                            direction={column.isSortedDesc ? 'desc' : 'asc'}
                            {...columnSortByProps}
                            style={style}
                            sx={{
                              '& svg': {
                                width: 16,
                                height: 16,
                                marginTop: 0,
                                marginLeft: 0.5,
                              },
                            }}
                          >
                            {column.render('Header')}
                          </TableSortLabel>
                        </Tooltip>
                      ) : (
                        <TableLabel style={style}>
                          {column.render('Header')}
                        </TableLabel>
                      )}
                      {column.canResize && (
                        <ColumnResizeHandle column={column} />
                      )}
                    </TableHeadCell>
                  )
                })}
              </TableHeadRow>
            )
          })}
        </TableHead>
        <TableBody {...getTableBodyProps()}>
          {page.map((row) => {
            prepareRow(row)
            const {
              key: rowKey,
              role: rowRole,
              ...rowProps
            } = row.getRowProps()

            return (
              <TableRow key={rowKey} {...rowProps}>
                {row.cells.map((cell) => {
                  const {
                    key: cellKey,
                    role: cellRole,
                    ...cellProps
                  } = cell.getCellProps()
                  return (
                    <TableCell key={cellKey} {...cellProps}>
                      {cell.isGrouped ? (
                        <>
                          <TableSortLabel
                            active
                            direction={row.isExpanded ? 'desc' : 'asc'}
                            IconComponent={KeyboardArrowUp}
                            {...row.getToggleRowExpandedProps()}
                          />{' '}
                          {cell.render('Cell', { editable: false })} (
                          {row.subRows.length})
                        </>
                      ) : cell.isAggregated ? (
                        cell.render('Aggregated')
                      ) : cell.isPlaceholder ? null : (
                        cell.render('Cell')
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </StyledTable>
      <TablePagination instance={instance} />
    </Fragment>
  )
}

export { Table }
