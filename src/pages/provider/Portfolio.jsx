import { useEffect, useRef, useState } from 'react'
import { Eye, Images, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Modal, { ConfirmDialog } from '../../components/common/Modal'
import ProfileAvatar from '../../components/common/ProfileAvatar'
import { EmptyState } from '../../components/common/States'
import PortfolioCoverEditor from '../../components/providers/PortfolioCoverEditor'
import PortfolioImage from '../../components/providers/PortfolioImage'
import PortfolioProjectEditor from '../../components/providers/PortfolioProjectEditor'
import { categoryById } from '../../data/categories'
import { useApp } from '../../app/AppContext'
import { removePortfolioMedia, savePortfolioMedia } from '../../utils/profilePhotos'
import { formatDate } from '../../utils/format'
import { normalizePortfolio } from '../../utils/portfolio'

const imageFile = (value) => typeof File !== 'undefined' && value instanceof File
const mediaId = (ownerId, type) => `${ownerId}-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export default function ProviderPortfolio() {
  const { user, providerOf, portfolios, savePortfolio, toast } = useApp()
  const provider = providerOf(user.providerId)
  const providerId = user.providerId
  const saved = normalizePortfolio(portfolios?.[providerId])
  const [draft, setDraft] = useState(() => saved)
  const [coverSelection, setCoverSelection] = useState(null)
  const [coverResetKey, setCoverResetKey] = useState(0)
  const [editingProject, setEditingProject] = useState(undefined)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const submitLock = useRef(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [error, setError] = useState('')
  const [stagedMedia, setStagedMedia] = useState([])
  const [pendingRemoval, setPendingRemoval] = useState([])
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null)
  const category = categoryById(provider?.category)?.name ?? 'Local services'
  const original = saved

  useEffect(() => {
    if (!imageFile(coverSelection)) {
      setCoverPreviewUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(coverSelection)
    setCoverPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [coverSelection])

  const dirty = JSON.stringify(draft) !== JSON.stringify(original) || coverSelection !== null

  const saveProject = async (project) => {
    const savedIds = []
    try {
      for (const file of project.newPhotos) {
        const id = mediaId(providerId, 'project')
        await savePortfolioMedia(id, providerId, file)
        savedIds.push(id)
      }
    } catch (saveError) {
      await Promise.all(savedIds.map((id) => removePortfolioMedia(id)))
      throw saveError
    }
    const nextProject = { ...project, photoIds: [...project.photoIds, ...savedIds] }
    delete nextProject.newPhotos
    delete nextProject.removedIds
    setDraft((current) => ({
      ...current,
      projects: current.projects.some((item) => item.id === project.id)
        ? current.projects.map((item) => item.id === project.id ? nextProject : item)
        : [nextProject, ...current.projects],
    }))
    setStagedMedia((current) => [...current, ...savedIds])
    setPendingRemoval((current) => [...new Set([...current, ...project.removedIds])])
    setEditingProject(undefined)
  }

  const deleteProject = (project) => {
    setDraft((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== project.id) }))
    setPendingRemoval((current) => [...new Set([...current, ...project.photoIds])])
  }

  const saveChanges = async (event) => {
    event.preventDefault()
    if (submitLock.current) return
    submitLock.current = true
    setSaving(true)
    setError('')
    let newCoverId = null
    let portfolioSaved = false
    let next = draft
    try {
      if (imageFile(coverSelection)) {
        newCoverId = mediaId(providerId, 'cover')
        await savePortfolioMedia(newCoverId, providerId, coverSelection)
        next = { ...next, coverId: newCoverId }
      } else if (coverSelection === 'remove') {
        next = { ...next, coverId: null }
      }
      if (!savePortfolio(providerId, next)) {
        throw new Error('Could not save the portfolio in this browser. Check available storage and try again.')
      }
      portfolioSaved = true
      const toRemove = [...new Set([
        ...pendingRemoval,
        ...(coverSelection && saved.coverId ? [saved.coverId] : []),
      ])].filter((id) => id !== next.coverId && !next.projects.some((project) => project.photoIds.includes(id)))
      const cleanupResults = await Promise.allSettled(toRemove.map((id) => removePortfolioMedia(id)))
      if (cleanupResults.some((result) => result.status === 'rejected')) {
        toast('Portfolio saved, but one or more removed photos could not be cleared from browser storage.', 'error')
      }
      setDraft(next)
      setCoverSelection(null)
      setCoverResetKey((key) => key + 1)
      setPendingRemoval([])
      setStagedMedia([])
      toast(next.published ? 'Portfolio saved and published.' : 'Portfolio saved as a draft.')
    } catch (saveError) {
      if (newCoverId && !portfolioSaved) {
        try { await removePortfolioMedia(newCoverId) } catch { /* report the original save failure */ }
      }
      setError(saveError.message || 'Could not save your portfolio. Please try again.')
    } finally {
      submitLock.current = false
      setSaving(false)
    }
  }

  const cancelChanges = async () => {
    if (!dirty) return
    const results = await Promise.allSettled(stagedMedia.map((id) => removePortfolioMedia(id)))
    if (results.some((result) => result.status === 'rejected')) {
      toast('Changes were discarded, but some temporary photos could not be cleared.', 'error')
    }
    setDraft(saved)
    setCoverSelection(null)
    setCoverResetKey((key) => key + 1)
    setStagedMedia([])
    setPendingRemoval([])
    setError('')
  }

  if (!provider) return <EmptyState icon={Images} title="Provider profile not found" text="Sign in to a provider account to manage a portfolio." />

  return (
    <>
      <PageHeader title="My Portfolio" text="Show customers the quality and care behind your work."
        action={<Button variant="secondary" onClick={() => setPreviewOpen(true)}><Eye size={16} aria-hidden="true" /> Preview portfolio</Button>} />
      <form onSubmit={saveChanges} className="space-y-5">
        <PortfolioCoverEditor ownerId={provider.id} coverId={draft.coverId} selection={coverSelection} onSelectionChange={setCoverSelection} resetKey={coverResetKey} />
        <section className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <ProfileAvatar userId={provider.userId} name={provider.name} hue={provider.hue} size={56} />
            <div><p className="font-semibold">{provider.name}</p><p className="text-sm text-ink-soft">{provider.profession} · {provider.area}</p><p className="text-xs text-ink-muted">{category}</p></div>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-slate-50 p-3 text-sm">
            <input type="checkbox" checked={!!draft.published} onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-brand" />
            <span><span className="block font-semibold text-ink">Publish portfolio</span><span className="text-ink-muted">Let customers browse your completed work.</span></span>
          </label>
        </section>

        <section aria-labelledby="projects-heading" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 id="projects-heading" className="text-xl font-semibold">Portfolio projects</h2><p className="mt-1 text-sm text-ink-muted">Add real examples, before-and-after details, or the result you delivered.</p></div>
            <Button onClick={() => setEditingProject(null)}><Plus size={17} aria-hidden="true" /> Add project</Button>
          </div>
          {draft.projects.length === 0
            ? <EmptyState icon={Images} title="Your portfolio is ready for its first project" text="Add a project with photos and a short description to help customers understand your work." actionLabel="Add your first project" onAction={() => setEditingProject(null)} />
            : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {draft.projects.map((project) => <article key={project.id} className="card overflow-hidden">
                <div className="relative aspect-[4/3] bg-slate-100">
                  {project.photoIds[0] ? <PortfolioImage ownerId={provider.id} mediaId={project.photoIds[0]} alt={`${project.title} project`} className="h-full w-full" /> : <div className="flex h-full items-center justify-center text-ink-muted"><Images size={36} aria-hidden="true" /></div>}
                  {project.photoIds.length > 1 && <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">{project.photoIds.length} photos</span>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-brand-800">{categoryById(project.category)?.name ?? 'Project'}</p><h3 className="mt-1 font-semibold">{project.title}</h3></div>
                    <button type="button" onClick={() => setConfirmAction({ type: 'delete', project })} aria-label={`Delete ${project.title}`} className="rounded p-2 text-ink-muted hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"><Trash2 size={17} aria-hidden="true" /></button>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{project.description}</p>
                  {(project.completedAt || project.location) && <p className="mt-3 text-xs text-ink-muted">{[project.location, project.completedAt ? formatDate(project.completedAt) : ''].filter(Boolean).join(' · ')}</p>}
                  <Button variant="secondary" size="sm" className="mt-4" onClick={() => setEditingProject(project)}>Edit project</Button>
                </div>
              </article>)}
            </div>}
        </section>
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">Portfolio details are saved only in this browser. Photos use browser-local storage and are not uploaded or shared with other devices.</p>
        {error && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={saving} disabled={saving || !dirty}>Save portfolio</Button>
          <Button type="button" variant="secondary" onClick={() => setConfirmAction({ type: 'discard' })} disabled={saving || !dirty}>Cancel changes</Button>
          <span className="self-center text-sm text-ink-muted">{draft.published ? 'Currently published' : 'Draft — not shown to customers'}</span>
        </div>
      </form>

      {editingProject !== undefined && <PortfolioProjectEditor key={editingProject?.id ?? 'new-project'} ownerId={provider.id} project={editingProject} defaultCategory={provider.category} onSave={saveProject} onClose={() => setEditingProject(undefined)} />}
      {previewOpen && <PortfolioPreview provider={provider} portfolio={draft} coverSelection={coverSelection} coverPreviewUrl={coverPreviewUrl} onClose={() => setPreviewOpen(false)} />}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.type === 'delete') deleteProject(confirmAction.project)
          if (confirmAction?.type === 'discard') cancelChanges()
          setConfirmAction(null)
        }}
        title={confirmAction?.type === 'delete' ? 'Delete this project?' : 'Discard portfolio changes?'}
        message={confirmAction?.type === 'delete'
          ? `Remove “${confirmAction.project?.title}” and its photos from the draft? The deletion takes effect when you save your portfolio.`
          : 'Discard your unsaved portfolio edits and temporary photos? This cannot be undone.'}
        confirmLabel={confirmAction?.type === 'delete' ? 'Delete project' : 'Discard changes'}
        danger
      />
    </>
  )
}

function PortfolioPreview({ provider, portfolio, coverSelection, coverPreviewUrl, onClose }) {
  const coverId = coverSelection === 'remove' ? null : portfolio.coverId
  const projects = portfolio.projects
  return (
    <Modal open onClose={onClose} title="Portfolio preview">
      <div className="max-h-[70vh] space-y-4 overflow-y-auto">
        <div className="relative h-36 overflow-hidden rounded-md bg-gradient-to-br from-brand-800 via-brand-700 to-emerald-300 sm:h-48">
          {coverPreviewUrl ? <img src={coverPreviewUrl} alt="Selected cover preview" className="h-full w-full object-cover" />
            : coverId ? <PortfolioImage ownerId={provider.id} mediaId={coverId} alt="Portfolio cover" className="h-full w-full" /> : null}
        </div>
        <div className="flex items-center gap-3">
          <ProfileAvatar userId={provider.userId} name={provider.name} hue={provider.hue} size={52} />
          <div><h3 className="font-semibold">{provider.name}</h3><p className="text-sm text-ink-soft">{provider.profession} · {provider.area}</p></div>
        </div>
        <p className="text-sm text-ink-soft">{provider.bio}</p>
        <h3 className="font-semibold">Selected work {portfolio.published ? '· Published' : '· Draft'}</h3>
        {!projects.length ? <p className="rounded-md bg-slate-50 p-4 text-sm text-ink-muted">No projects added yet.</p>
          : <div className="grid gap-3 sm:grid-cols-2">{projects.map((project) => <article key={project.id} className="overflow-hidden rounded-md border border-line">
            {project.photoIds[0] && <PortfolioImage ownerId={provider.id} mediaId={project.photoIds[0]} alt={`${project.title} project`} className="h-32 w-full" />}
            <div className="p-3"><p className="text-xs font-medium text-brand-800">{categoryById(project.category)?.name ?? 'Project'}</p><h4 className="font-semibold">{project.title}</h4><p className="mt-1 line-clamp-2 text-sm text-ink-soft">{project.description}</p></div>
          </article>)}</div>}
      </div>
    </Modal>
  )
}
