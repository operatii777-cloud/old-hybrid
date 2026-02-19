import React, { useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

/**
 * AdminGrid – unified AG Grid wrapper for all admin table views.
 *
 * Props:
 *  - rowData: array of row objects
 *  - columnDefs: array of AG Grid column definitions
 *  - defaultColDef: optional overrides to merged with our defaults
 *  - onCellValueChanged: optional cell edit callback
 *  - pinnedActions: optional column def for a pinned-right action column
 *  - exportFileName: base name for XLSX export (no extension)
 *  - height: grid height (default 500px)
 *  - ...rest: any other AgGridReact props
 */
export default function AdminGrid({
  rowData = [],
  columnDefs = [],
  defaultColDef: userDefaultColDef = {},
  onCellValueChanged,
  pinnedActions,
  exportFileName = 'export',
  height = 500,
  ...rest
}) {
  const gridRef = useRef(null);

  const mergedDefaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    editable: false,
    minWidth: 80,
    flex: 1,
    ...userDefaultColDef
  };

  // Build final column defs; optionally append pinned action column
  const finalColumnDefs = pinnedActions
    ? [...columnDefs, { ...pinnedActions, pinned: 'right', lockPinned: true, suppressSizeToFit: true }]
    : columnDefs;

  const handleExportCsv = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({ fileName: `${exportFileName}.csv` });
  }, [exportFileName]);

  const handleExportExcel = useCallback(() => {
    if (gridRef.current?.api?.exportDataAsExcel) {
      gridRef.current.api.exportDataAsExcel({ fileName: `${exportFileName}.xlsx` });
    } else {
      // Fallback to CSV when enterprise export is unavailable
      handleExportCsv();
    }
  }, [exportFileName, handleExportCsv]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 justify-end">
        <button
          onClick={handleExportCsv}
          className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white text-xs rounded font-bold"
          title="Export CSV"
        >⬇ CSV</button>
        <button
          onClick={handleExportExcel}
          className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded font-bold"
          title="Export XLSX"
        >⬇ XLSX</button>
      </div>
      <div
        className="ag-theme-alpine-dark"
        style={{ height, width: '100%' }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={finalColumnDefs}
          defaultColDef={mergedDefaultColDef}
          onCellValueChanged={onCellValueChanged}
          animateRows={true}
          enableRangeSelection={true}
          enableClipboard={true}
          suppressCopyRowsToClipboard={false}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          pagination={true}
          paginationPageSize={50}
          domLayout="normal"
          {...rest}
        />
      </div>
    </div>
  );
}
