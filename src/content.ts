import { coreFrontend, frameworks, workFocus, workRoles } from "./data";
import {
  createDoc,
  fetchCertificates,
  fetchContactInfo,
  fetchDocs,
  watchDocs,
  type CertificateItem,
  type ContactInfoItem,
  type ProjectItem,
  type StackItem,
  type WorkFocusItem,
  type WorkRoleItem,
} from "./firebase";

export const fallbackProjects: ProjectItem[] = [];

export const fallbackCertificates: CertificateItem[] = [];

export const fallbackContactInfo: ContactInfoItem[] = [
  { id: "email", label: "Email", value: "hucainomar490@gmail.com", icon: "Mail", order: 1 },
  { id: "location", label: "Where I am", value: "Lahore, Pakistan", icon: "MapPin", order: 2 },
  { id: "reply", label: "How fast I reply", value: "Usually within a day", icon: "Clock3", order: 3 },
];

export async function loadCertificates() {
  try {
    const remote = await fetchCertificates();
    return remote.length ? remote : fallbackCertificates;
  } catch {
    return fallbackCertificates;
  }
}

export async function loadContactInfo(): Promise<ContactInfoItem[]> {
  try {
    const remote = await fetchContactInfo();
    return remote.length ? remote : fallbackContactInfo;
  } catch {
    return fallbackContactInfo;
  }
}

export const fallbackStack: StackItem[] = [
  ...coreFrontend.map((item, index) => ({
    ...item,
    id: item.key,
    group: "core" as const,
    order: index,
  })),
  ...frameworks.map((item, index) => ({
    ...item,
    id: item.key,
    group: "framework" as const,
    order: index,
  })),
];

export const fallbackWorkRoles: WorkRoleItem[] = workRoles.map((item, index) => ({
  ...item,
  id: `role-${index}`,
  order: index,
}));

export const fallbackWorkFocus: WorkFocusItem[] = workFocus.map((item, index) => ({
  ...item,
  id: `focus-${index}`,
  order: index,
}));

export async function loadProjects() {
  const remote = await fetchDocs<ProjectItem>("projects");
  return remote.length ? remote : fallbackProjects;
}

export async function loadStack() {
  const remote = await fetchDocs<StackItem>("stack");
  return remote.length ? remote : fallbackStack;
}

export async function loadWorkRoles() {
  const remote = await fetchDocs<WorkRoleItem>("workRoles");
  return remote.length ? remote : fallbackWorkRoles;
}

export async function loadWorkFocus() {
  const remote = await fetchDocs<WorkFocusItem>("workFocus");
  return remote.length ? remote : fallbackWorkFocus;
}

// --------------------------------------------------------------------------
// Real-time watchers — each calls `onChange` whenever Firestore updates.
// Falls back to defaults when the collection is empty. Returns unsubscribe.
// --------------------------------------------------------------------------
export function watchProjects(onChange: (items: ProjectItem[]) => void): () => void {
  return watchDocs<ProjectItem>("projects", (items) => {
    onChange(items.length ? items : fallbackProjects);
  });
}

export function watchStack(onChange: (items: StackItem[]) => void): () => void {
  return watchDocs<StackItem>("stack", (items) => {
    onChange(items.length ? items : fallbackStack);
  });
}

export function watchWorkRoles(onChange: (items: WorkRoleItem[]) => void): () => void {
  return watchDocs<WorkRoleItem>("workRoles", (items) => {
    onChange(items.length ? items : fallbackWorkRoles);
  });
}

export function watchWorkFocus(onChange: (items: WorkFocusItem[]) => void): () => void {
  return watchDocs<WorkFocusItem>("workFocus", (items) => {
    onChange(items.length ? items : fallbackWorkFocus);
  });
}

export function watchCertificates(onChange: (items: CertificateItem[]) => void): () => void {
  return watchDocs<CertificateItem>("certificates", (items) => {
    onChange(items.length ? items : fallbackCertificates);
  });
}

export function watchContactInfo(onChange: (items: ContactInfoItem[]) => void): () => void {
  return watchDocs<ContactInfoItem>("contactInfo", (items) => {
    onChange(items.length ? items : fallbackContactInfo);
  });
}

// --------------------------------------------------------------------------
// Seed All — populates every Firestore collection from fallback data in one
// call. Only creates documents where the collection is currently empty so it
// is safe to run repeatedly.
// --------------------------------------------------------------------------
export interface SeedProgress {
  collection: string;
  count: number;
}

export async function seedAll(): Promise<SeedProgress[]> {
  const results: SeedProgress[] = [];

  // Stack
  const existingStack = await fetchDocs<StackItem>("stack");
  if (existingStack.length === 0 && fallbackStack.length > 0) {
    for (const item of fallbackStack) {
      const { id: _id, ...rest } = item;
      await createDoc("stack", rest);
    }
    results.push({ collection: "stack", count: fallbackStack.length });
  }

  // Work Roles
  const existingRoles = await fetchDocs<WorkRoleItem>("workRoles");
  if (existingRoles.length === 0 && fallbackWorkRoles.length > 0) {
    for (const item of fallbackWorkRoles) {
      const { id: _id, ...rest } = item;
      await createDoc("workRoles", rest);
    }
    results.push({ collection: "workRoles", count: fallbackWorkRoles.length });
  }

  // Work Focus
  const existingFocus = await fetchDocs<WorkFocusItem>("workFocus");
  if (existingFocus.length === 0 && fallbackWorkFocus.length > 0) {
    for (const item of fallbackWorkFocus) {
      const { id: _id, ...rest } = item;
      await createDoc("workFocus", rest);
    }
    results.push({ collection: "workFocus", count: fallbackWorkFocus.length });
  }

  // Contact Info
  const existingContact = await fetchContactInfo();
  if (existingContact.length === 0 && fallbackContactInfo.length > 0) {
    for (const item of fallbackContactInfo) {
      const { id: _id, ...rest } = item;
      await createDoc("contactInfo", rest);
    }
    results.push({ collection: "contactInfo", count: fallbackContactInfo.length });
  }

  return results;
}
