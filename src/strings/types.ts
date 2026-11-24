/** The built-in texts. Those with parts to fill in are functions. */
export interface Strings {
  help: string
  close: string
  collapse: string
  collapsePanel: string
  expandPanel: string
  noMatches: string
  errorTitle: string
  errorHint: string

  /** A number of thousands on a chart axis: "3.8" -> "3.8k". */
  thousands: (amount: string) => string
  total: string
  leftOut: string

  overMidnight: string
  rangeStart: string
  rangeEnd: string
  /** Tooltip of a band under HourRange. */
  bandTitle: (label: string, spans: string, note?: string) => string
  bandsHint: string

  legend: string
  foldLegend: string

  treeLeftOut: (count: number) => string
  treeSome: (count: number, all: number) => string
  treeIncludeAll: string
  treeInclude: (id: string) => string
  treePutBack: string
  treeLeaveOut: string
  treeLast: string
  treeHint: string

  share: string
  shared: string
  copyImage: string
  copying: string
  copied: string
  download: string
  downloadTitle: string
  link: string
  linked: string
  linkTitle: string
  savedInstead: string
  saved: string
  failed: string

  /** Caption of the hourly bars on a share card. */
  cardProfile: (max: string) => string

  /** Name of a sort control in a DataTable: "Sort by Name". */
  sortBy: (name: string) => string
  /** Said after a sort changed. */
  sortedBy: (name: string, dir: 'asc' | 'desc') => string
  sortCleared: string
  /** The first column, where its head is not text. */
  sortLabel: string

  /** Names of the basemaps, by key. */
  basemaps: Record<string, string>
}
