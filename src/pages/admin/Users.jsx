import { useEffect, useMemo, useState } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Pagination from '../../components/common/Pagination'
import Button from '../../components/common/Button'
import Modal, { ConfirmDialog } from '../../components/common/Modal'
import { Badge } from '../../components/common/Badges'
import { useApp } from '../../app/AppContext'
import { formatDate } from '../../utils/format'
import { fetchAdminUsers, updateAdminUserStatus } from '../../api/admin'

const PAGE_SIZE = 8
const tone = { active: 'green', pending: 'amber', suspended: 'red' }

function normalizeUser(user) {
  return {
    ...user,
    role: String(user.role || '').toLowerCase(),
    status: String(user.status || '').toLowerCase(),
    joined: user.joined || user.createdAt,
  }
}

export default function AdminUsers() {
  const { toast } = useApp()
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState(null)
  const [toggle, setToggle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchAdminUsers()
      setUsers(result.map(normalizeUser))
    } catch (err) {
      setError(err.message || 'Could not load users from the server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return users.filter((u) =>
      (!role || u.role === role) &&
      (!status || u.status === status) &&
      (!query || `${u.name} ${u.email} ${u.id}`.toLowerCase().includes(query)))
  }, [users, q, role, status])

  const pages = Math.ceil(rows.length / PAGE_SIZE)
  useEffect(() => setPage((current) => Math.min(current, Math.max(1, pages))), [pages])
  const change = (fn) => (e) => { fn(e.target.value); setPage(1) }

  const flip = async (u) => {
    if (!u || saving) return
    const next = u.status === 'suspended' ? 'ACTIVE' : 'SUSPENDED'
    setSaving(true)
    try {
      const updated = normalizeUser(await updateAdminUserStatus(u.id, next))
      setUsers((all) => all.map((item) => item.id === updated.id ? updated : item))
      setToggle(null)
      if (sel?.id === updated.id) setSel(updated)
      toast(`User ${next === 'ACTIVE' ? 'reactivated' : 'suspended'} successfully.`)
    } catch (err) {
      toast(err.message || 'Could not update this user.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Users" text={`${rows.length} matching accounts from the database`} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1"><label htmlFor="uq" className="sr-only">Search users</label><Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" /><input id="uq" className="input pl-9" placeholder="Search name, email, or ID" value={q} onChange={change(setQ)} /></div>
        <label className="sr-only" htmlFor="ur">Role</label><select id="ur" className="input sm:!w-40" value={role} onChange={change(setRole)}><option value="">All roles</option><option value="customer">Customer</option><option value="provider">Provider</option><option value="admin">Admin</option></select>
        <label className="sr-only" htmlFor="us">Status</label><select id="us" className="input sm:!w-40" value={status} onChange={change(setStatus)}><option value="">All statuses</option><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option></select>
        <Button size="sm" variant="secondary" onClick={loadUsers} disabled={loading}><RefreshCw size={15} className="mr-1" />Refresh</Button>
      </div>

      {loading && <div role="status" className="card p-8 text-center text-ink-soft">Loading users from PostgreSQL…</div>}
      {!loading && error && <div role="alert" className="card space-y-3 p-6"><p className="text-sm text-red-700">{error}</p><Button variant="secondary" onClick={loadUsers}>Try again</Button></div>}
      {!loading && !error && <>
        <DataTable empty="No users match these filters." rows={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)} columns={[
          { key: 'name', header: 'User', render: (u) => <div className="min-w-0"><p className="font-medium">{u.name}</p><p className="break-all text-xs text-ink-muted">{u.id}</p></div> },
          { key: 'email', header: 'Email' },
          { key: 'role', header: 'Role', render: (u) => <span className="capitalize">{u.role}</span> },
          { key: 'status', header: 'Status', render: (u) => <Badge tone={tone[u.status] ?? 'slate'}>{u.status}</Badge> },
          { key: 'a', header: 'Actions', render: (u) => <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setSel(u)}>Details</Button>{u.role !== 'admin' && <Button size="sm" variant="ghost" onClick={() => setToggle(u)}>{u.status === 'suspended' ? 'Reactivate' : 'Suspend'}</Button>}</div> },
        ]} />
        <Pagination page={page} pages={pages} onChange={setPage} />
      </>}
      <Modal open={!!sel} onClose={() => setSel(null)} title="User details" footer={<Button onClick={() => setSel(null)}>Close</Button>}>
        {sel && <dl className="divide-y divide-line text-sm">{[['Name', sel.name], ['Email', sel.email], ['User ID', sel.id], ['Role', sel.role], ['Status', sel.status], ['Location', sel.area || '—'], ['Phone', sel.phone || 'Not provided'], ['Joined', formatDate(sel.joined)]].map(([k, v]) => <div key={k} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4"><dt className="text-ink-muted">{k}</dt><dd className={`break-all font-medium sm:text-right ${k === 'Role' || k === 'Status' ? 'capitalize' : ''}`}>{v}</dd></div>)}</dl>}
      </Modal>
      <ConfirmDialog open={!!toggle} onClose={() => setToggle(null)} danger={toggle?.status !== 'suspended'} title={toggle?.status === 'suspended' ? 'Reactivate user?' : 'Suspend user?'} confirmLabel={toggle?.status === 'suspended' ? 'Reactivate' : 'Suspend'} message={toggle?.status === 'suspended' ? `Reactivate ${toggle?.name}? This updates the production database.` : `Suspend ${toggle?.name}? This updates the production database and may prevent the user from accessing protected features.`} onConfirm={() => flip(toggle)} />
    </>
  )
}
