export enum Column {
    AMOUNT = "AMOUNT",
    NAME = "NAME",
    DATE = "DATE"
}

export function getColumnName(column: Column): string {
  switch (column) {
  case Column.AMOUNT:
    return "Amount";
  case Column.NAME:
    return "Name";
  case Column.DATE:
    return "Date";
  }
}
