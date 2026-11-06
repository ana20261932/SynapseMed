import React from 'react';
import { Card, CardTitle } from './Card';

// ── Table ──────────────────────────────────────────────────────────────────

interface TableProps {
  columns: string[];
  data: any[];
  rowKey?: string;
  renderCell?: (row: any, column: string) => React.ReactNode;
  emptyMessage?: string;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      style={{ color: 'var(--color-fg-subtle)' }}
    >
      <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m8-5v5" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function Table({ columns, data, rowKey = 'id', renderCell, emptyMessage = 'No records found.' }: TableProps) {
  if (data.length === 0) {
    return (
      <div className="sk-card">
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--color-border-default)', background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
      <table className="sk-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row[rowKey] ?? Math.random())}>
              {columns.map((col) => (
                <td key={col}>
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

// ── DataTable ──────────────────────────────────────────────────────────────

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
      {(title || actions) && (
        <div className="flex items-center justify-between mb-5">
          {title && <CardTitle>{title}</CardTitle>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <Table columns={columns} data={data} renderCell={renderCell} emptyMessage={emptyMessage} />
    </Card>
  );
}
