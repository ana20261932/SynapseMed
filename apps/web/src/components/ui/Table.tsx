import React from 'react';
import { Card } from './Card';

interface TableProps {
  columns: string[];
  data: any[];
  rowKey?: string;
  renderCell?: (row: any, column: string) => React.ReactNode;
  emptyMessage?: string;
}

export function Table({ columns, data, rowKey = 'id', renderCell, emptyMessage = 'No records found.' }: TableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-clinic-200 rounded-2xl p-8 text-center">
        <p className="text-clinic-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-clinic-200 rounded-2xl bg-white shadow-card">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="bg-clinic-50 border-b border-clinic-200 px-4 py-3 text-xs font-semibold text-clinic-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row[rowKey])} className="border-b border-clinic-100 last:border-0 hover:bg-clinic-50 transition-colors">
              {columns.map((col) => (
                <td key={col} className="px-4 py-3 text-sm text-clinic-700">
                  {renderCell ? renderCell(row, col) : String(row[col] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DataTableProps {
  title?: string;
  columns: string[];
  data: Record<string, unknown>[];
  renderCell?: (row: any, column: string) => React.ReactNode;
  emptyMessage?: string;
  actions?: React.ReactNode;
}

export function DataTable({ title, columns, data, renderCell, emptyMessage, actions }: DataTableProps) {
  return (
    <Card className="mb-6">
      {title || actions && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-clinic-900">{title}</h3>
          {actions}
        </div>
      )}
      <Table columns={columns} data={data} renderCell={renderCell} emptyMessage={emptyMessage} />
    </Card>
  );
}
