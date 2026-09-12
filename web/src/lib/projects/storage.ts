import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { isProjectId, normaliseProject, PROJECT_LIMITS, type Project, type ProjectInput } from "@/lib/projects/project";

/** Projects never expire on their own; they're the user's workspace. */
const PROJECT_TTL = 3 * 365 * 24 * 60 * 60;

export function newProjectId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return `pr_${Buffer.from(bytes).toString("base64url")}`;
}

const projectKey = (id: string) => `project:${id}`;
const indexKey = (uid: string) => `user:${uid}:projects`;
const currentKey = (uid: string) => `user:${uid}:project:current`;

export async function loadProject(id: string, uid: string, store: KeyValueStore = getStore()): Promise<Project | null> {
  if (!isProjectId(id)) return null;
  const raw = await store.get(projectKey(id));
  if (!raw) return null;
  try {
    const project = JSON.parse(raw) as Project;
    return project.ownerUid === uid ? project : null;
  } catch {
    return null;
  }
}

/** Public read (no owner check) for report pages that carry a project's brand. */
export async function loadProjectBrand(id: string, store: KeyValueStore = getStore()): Promise<Pick<Project, "brand" | "name" | "company"> | null> {
  if (!isProjectId(id)) return null;
  const raw = await store.get(projectKey(id));
  if (!raw) return null;
  try {
    const project = JSON.parse(raw) as Project;
    return { brand: project.brand, name: project.name, company: project.company };
  } catch {
    return null;
  }
}

export async function listProjects(uid: string, store: KeyValueStore = getStore()): Promise<Project[]> {
  const ids = await store.smembers(indexKey(uid));
  const projects: Project[] = [];
  for (const id of ids) {
    const project = await loadProject(id, uid, store);
    if (project) projects.push(project);
    else await store.srem(indexKey(uid), id);
  }
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createProject(uid: string, input: ProjectInput, store: KeyValueStore = getStore()): Promise<Project | { error: string }> {
  const existing = await store.smembers(indexKey(uid));
  if (existing.length >= PROJECT_LIMITS.perUser) return { error: `You can have up to ${PROJECT_LIMITS.perUser} projects. Delete one to add another.` };
  const now = new Date();
  const project = normaliseProject(input, { id: newProjectId(), ownerUid: uid, createdAt: now.toISOString() }, now);
  await store.set(projectKey(project.id), JSON.stringify(project), PROJECT_TTL);
  await store.sadd(indexKey(uid), project.id, PROJECT_TTL);
  return project;
}

export async function updateProject(id: string, uid: string, input: ProjectInput, store: KeyValueStore = getStore()): Promise<Project | null> {
  const current = await loadProject(id, uid, store);
  if (!current) return null;
  const project = normaliseProject(input, current);
  await store.set(projectKey(project.id), JSON.stringify(project), PROJECT_TTL);
  return project;
}

export async function deleteProject(id: string, uid: string, store: KeyValueStore = getStore()): Promise<boolean> {
  const current = await loadProject(id, uid, store);
  if (!current) return false;
  await store.del(projectKey(id));
  await store.srem(indexKey(uid), id);
  if ((await store.get(currentKey(uid))) === id) await store.del(currentKey(uid));
  return true;
}

export async function getCurrentProjectId(uid: string, store: KeyValueStore = getStore()): Promise<string | null> {
  return store.get(currentKey(uid));
}

export async function setCurrentProject(uid: string, id: string | null, store: KeyValueStore = getStore()): Promise<void> {
  if (!id) {
    await store.del(currentKey(uid));
    return;
  }
  await store.set(currentKey(uid), id, PROJECT_TTL);
}
