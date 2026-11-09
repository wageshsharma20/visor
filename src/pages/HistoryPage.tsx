import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Download,
  Trash2,
  Filter,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Button,
  Input,
  Select,
  StatusDot,
  Dialog,
} from '@/components/ui';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const totalRows = 0;

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto w-full pb-16 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-small text-text-2">Every object tracked in this session.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export CSV is hidden when there are 0 rows per requirement */}
          {totalRows > 0 && (
            <Button
              variant="secondary"
              size={32}
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => {}}
            >
              Export CSV
            </Button>
          )}

          <Button
            variant="danger"
            size={32}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setClearDialogOpen(true)}
          >
            Clear History
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <div className="p-3 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by class, tracking ID, or notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-44">
            <Select
              value={classFilter}
              onChange={setClassFilter}
              options={[
                { label: 'All Classes', value: 'all' },
                { label: 'Person', value: 'person' },
                { label: 'Vehicle', value: 'vehicle' },
                { label: 'Bag / Suitcase', value: 'bag' },
                { label: 'Animal', value: 'animal' },
              ]}
            />
          </div>

          <Button
            variant="ghost"
            size={36}
            icon={<Filter className="w-3.5 h-3.5" />}
            onClick={() => {
              setSearch('');
              setClassFilter('all');
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      {/* History Table Card with Sticky Header per DESIGN.md §7 */}
      <Card className="flex flex-col overflow-hidden">
        <CardHeader
          title="Session Records"
          icon={<Clock className="w-3.5 h-3.5 text-text-2" />}
          statusDot={<StatusDot state="idle" />}
          action={
            totalRows > 0 ? (
              <span className="font-mono text-data text-text-3 px-1.5 py-0.5 rounded-chip bg-bg-3 border border-line-1">
                {totalRows} records
              </span>
            ) : undefined
          }
        />

        {/* Table Structure */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line-1 bg-bg-3 text-label text-text-2 font-mono uppercase tracking-wider">
                <th className="py-2.5 px-3">Thumb</th>
                <th className="py-2.5 px-3">First Seen</th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3">Track ID</th>
                <th className="py-2.5 px-3">Peak Conf</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Flagged</th>
                <th className="py-2.5 px-3">AI Description</th>
              </tr>
            </thead>
            <tbody>
              {/* Honest Empty State */}
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-text-3 mb-3">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="text-body-strong text-text-1 mb-1">
                      No Records In Session
                    </div>
                    <p className="text-small text-text-3 mb-4 leading-relaxed">
                      Detections tracked by the vision engine will be cataloged with micro-thumbnails,
                      timestamps, and exportable metadata.
                    </p>
                    <Button
                      variant="primary"
                      size={32}
                      icon={<Radio className="w-3.5 h-3.5" />}
                      onClick={() => navigate('/live')}
                    >
                      Open Live Monitor →
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Clear Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        title="Clear Detection History"
        description="Delete all 0 session detections? This action cannot be undone."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size={32} onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size={32} onClick={() => setClearDialogOpen(false)}>
              Clear records
            </Button>
          </div>
        }
      >
        <div className="text-small text-text-3">
          All cataloged bounding tracks and telemetry metadata will be purged from the session.
        </div>
      </Dialog>
    </div>
  );
};
