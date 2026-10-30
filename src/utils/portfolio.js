export function normalizePortfolio(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { coverId: null, published: false, projects: [] }
  }
  const projects = Array.isArray(value.projects) ? value.projects
    .filter((project) => project && typeof project === 'object' && typeof project.id === 'string')
    .map((project) => ({
      id: project.id,
      title: typeof project.title === 'string' ? project.title : 'Untitled project',
      description: typeof project.description === 'string' ? project.description : '',
      category: typeof project.category === 'string' ? project.category : '',
      completedAt: typeof project.completedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(project.completedAt) ? project.completedAt : '',
      location: typeof project.location === 'string' ? project.location : '',
      photoIds: Array.isArray(project.photoIds) ? project.photoIds.filter((id) => typeof id === 'string') : [],
    }))
    : []
  return {
    coverId: typeof value.coverId === 'string' ? value.coverId : null,
    published: value.published === true,
    projects,
  }
}
