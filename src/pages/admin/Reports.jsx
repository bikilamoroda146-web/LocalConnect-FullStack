import React, { useState } from 'react';

import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import Button from '../../components/common/Button'
import Tabs from '../../components/common/Tabs'
import { Badge } from '../../components/common/Badges'
import { ConfirmDialog } from '../../components/common/Modal'
import { EmptyState } from '../../components/common/States'
import { useApp } from '../../app/AppContext'
import { categories } from '../../data/categories'
import { STATUS } from '../../utils/bookings'
import { formatDate } from '../../utils/format'
import { FileWarning, Users, Briefcase } from 'lucide-react'

function Bars({ data, label }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <ul className="space-y-3" aria-label={label}>{data.map((d) => (
      <li key={d.label}><div className="mb-1 flex justify-between text-sm"><span>{d.label}</span><span className="font-semibold">{d.value}</span></div>
        <div className="h-2.5 rounded bg-slate-100" role="presentation"><div className="h-full rounded bg-brand" style={{ width: `${(d.value / max) * 100}%` }} /></div></li>))}</ul>
  )
}

export default function AdminReports() {
  const { bookings, services, users, reports, resolveReport } = useApp()
  const [filter, setFilter] = useState('all')
  const [resolving, setResolving] = useState(null)
  const byStatus = Object.entries(STATUS).map(([k, v]) => ({ label: v.label, value: bookings.filter((b) => b.status === k).length }))
  const byCat = categories.map((c) => ({ label: c.name, value: services.filter((s) => s.category === c.id).length }))
  const months = ['Aug', 'Sep', 'Oct', 'Nov']
  const byMonth = months.map((m, i) => ({ label: m, value: bookings.filter((b) => b.date.slice(5, 7) === String(8 + i).padStart(2, '0')).length }))
  const reportRows = reports.filter((report) => filter === 'all' || report.status === filter)
  return (
    <>
      <PageHeader title="Reports" text="Figures and reports below are calculated from sample data stored in this browser; they are illustrative, not live analytics." />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={Users} label="Customers" value={users.filter((u) => u.role === 'customer').length} />
        <StatCard icon={Briefcase} label="Providers" value={users.filter((u) => u.role === 'provider').length} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="m"><h2 id="m" className="mb-4 font-semibold">Booking activity by appointment month</h2><Bars data={byMonth} label="Bookings per month" /></section>
        <section className="card p-5" aria-labelledby="s"><h2 id="s" className="mb-4 font-semibold">Status breakdown</h2><Bars data={byStatus} label="Bookings by status" /></section>
        <section className="card p-5 lg:col-span-2" aria-labelledby="c"><h2 id="c" className="mb-4 font-semibold">Services by category</h2><Bars data={byCat} label="Services by category" /></section>
      </div>
      <section className="mt-8" aria-labelledby="r">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm font-semibold text-brand-800">Moderation queue</p><h2 id="r" className="mt-1 text-lg font-semibold">Reported content</h2></div>
          <p className="text-sm text-ink-muted">{reports.filter((report) => report.status === 'open').length} open</p>
        </div>
        <Tabs label="Report status" value={filter} onChange={setFilter} tabs={[
          { id: 'all', label: 'All', count: reports.length },
          { id: 'open', label: 'Open', count: reports.filter((report) => report.status === 'open').length },
          { id: 'resolved', label: 'Resolved', count: reports.filter((report) => report.status === 'resolved').length },
        ]} />
        <div className="mt-4">
          {reportRows.length === 0 ? (
            <EmptyState icon={FileWarning} title={filter === 'all' ? 'No reports yet' : `No ${filter} reports`} text="Reports from the sample data will appear here." />
          ) : (
            <ul className="space-y-3">
              {reportRows.map((report) => (
                <li key={report.id} className="card p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{report.target}</h3>
                        <Badge tone={report.status === 'open' ? 'amber' : 'green'}>{report.status === 'open' ? 'Open' : 'Resolved'}</Badge>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{report.reason}</p>
                      <p className="mt-2 text-xs text-ink-muted">Report {report.id} · Submitted {formatDate(report.date)}</p>
                    </div>
                    {report.status === 'open' && <Button size="sm" variant="secondary" onClick={() => setResolving(report)}>Resolve report</Button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <ConfirmDialog
        open={!!resolving}
        onClose={() => setResolving(null)}
        title="Resolve this report?"
        confirmLabel="Resolve report"
        message={resolving ? `Mark report ${resolving.id} about “${resolving.target}” as resolved in this browser’s sample data?` : ''}
        onConfirm={() => resolving && resolveReport(resolving.id)}
      />
    </>
  )
}
