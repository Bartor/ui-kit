import type { Strings } from './types.js'

export const pl: Strings = {
  help: 'Wyjaśnienie',
  close: 'Zamknij',
  collapse: 'Zwiń',
  collapsePanel: 'Zwiń panel',
  expandPanel: 'Rozwiń panel',
  noMatches: 'Brak dopasowań.',
  errorTitle: 'Nie udało się wyświetlić panelu',
  errorHint: 'Reszta strony działa dalej — wybierz coś innego albo zamknij panel.',

  thousands: (s) => `${s} tys.`,
  total: 'razem',
  leftOut: 'pominięty',

  overMidnight: 'przez północ',
  rangeStart: 'Początek okresu',
  rangeEnd: 'Koniec okresu',
  bandTitle: (label, spans, note) => `${label}: pomiar ${spans}${note ? ` — ${note}` : ''}`,
  bandsHint: 'Paski pod suwakiem: godziny objęte pomiarem dla widocznych warstw — '
    + 'przerwa oznacza brak danych. Najedź na pasek po szczegóły.',

  legend: 'Legenda',
  foldLegend: 'Zwiń legendę',

  treeLeftOut: (n) => `${n} pominięte`,
  treeSome: (n, all) => `${n} z ${all}`,
  treeIncludeAll: 'wlicz wszystkie',
  treeInclude: (id) => `Wliczaj ${id}`,
  treePutBack: 'Wlicz do sumy',
  treeLeaveOut: 'Pomiń w sumie',
  treeLast: 'Musi zostać co najmniej jedna część',
  treeHint: 'Pominięte części nie wliczają się do sumy.',

  share: 'Udostępnij',
  shared: 'Udostępniono ✓',
  copyImage: 'Kopiuj obraz',
  copying: 'Kopiuję…',
  copied: 'Skopiowano ✓',
  download: 'Pobierz',
  downloadTitle: 'Pobierz obraz PNG',
  link: 'Link',
  linked: 'Link ✓',
  linkTitle: 'Kopiuj link do tego widoku',
  savedInstead: 'schowek niedostępny — pobrano plik',
  saved: 'pobrano plik',
  failed: 'nie udało się',

  cardProfile: (max) => `profil dobowy · maks. ${max}`,

  sortBy: (name) => `Sortuj według: ${name}`,
  sortedBy: (name, dir) => `Posortowano według: ${name}, ${dir === 'asc' ? 'rosnąco' : 'malejąco'}`,
  sortCleared: 'Kolejność pierwotna',
  sortReset: 'Kolejność pierwotna',
  resizeColumn: (name) => `Zmień szerokość: ${name}`,
  widthsReset: 'Domyślne szerokości',
  sortLabel: 'pierwszej kolumny',

  basemaps: {
    darkGray: 'Ciemnoszara z nazwami',
    darkGrayPlain: 'Ciemnoszara, bez nazw',
    lightGray: 'Jasnoszara z nazwami',
    black: 'Czarna (CARTO)',
    osm: 'OpenStreetMap',
  },
}
