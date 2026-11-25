import type { Strings } from './types.js'

export const en: Strings = {
  help: 'Explanation',
  close: 'Close',
  collapse: 'Collapse',
  collapsePanel: 'Collapse the panel',
  expandPanel: 'Expand the panel',
  noMatches: 'No matches.',
  errorTitle: 'This panel could not be shown',
  errorHint: 'The rest of the page still works - pick something else or close the panel.',

  thousands: (s) => `${s}k`,
  total: 'total',
  leftOut: 'left out',

  overMidnight: 'over midnight',
  rangeStart: 'Start of the period',
  rangeEnd: 'End of the period',
  bandTitle: (label, spans, note) => `${label}: measured ${spans}${note ? ` - ${note}` : ''}`,
  bandsHint: 'Bands under the slider: the hours each visible layer was measured in - '
    + 'a gap means no data. Hover a band for details.',

  legend: 'Legend',
  foldLegend: 'Fold the legend',

  treeLeftOut: (n) => `${n} left out`,
  treeSome: (n, all) => `${n} of ${all}`,
  treeIncludeAll: 'include all',
  treeInclude: (id) => `Include ${id}`,
  treePutBack: 'Include in the total',
  treeLeaveOut: 'Leave out of the total',
  treeLast: 'At least one piece has to stay',
  treeHint: 'Pieces left out do not count towards the total.',

  share: 'Share',
  shared: 'Shared ✓',
  copyImage: 'Copy image',
  copying: 'Copying…',
  copied: 'Copied ✓',
  download: 'Download',
  downloadTitle: 'Download as a PNG image',
  link: 'Link',
  linked: 'Link ✓',
  linkTitle: 'Copy a link to this view',
  savedInstead: 'no clipboard access - file downloaded',
  saved: 'file downloaded',
  failed: 'that did not work',

  cardProfile: (max) => `hourly profile · max. ${max}`,

  sortBy: (name) => `Sort by ${name}`,
  sortedBy: (name, dir) => `Sorted by ${name}, ${dir === 'asc' ? 'ascending' : 'descending'}`,
  sortCleared: 'Original order',
  sortReset: 'Original order',
  resizeColumn: (name) => `Resize ${name}`,
  widthsReset: 'Default widths',
  sortLabel: 'the first column',

  basemaps: {
    darkGray: 'Dark grey, labelled',
    darkGrayPlain: 'Dark grey, no labels',
    lightGray: 'Light grey, labelled',
    black: 'Black (CARTO)',
    osm: 'OpenStreetMap',
  },
}
