
import type { StoredWorkProfile } from '../types.ts';

class WorkProfilesStore {
  private profiles = new Map<string, StoredWorkProfile>();

  upsert(profile: StoredWorkProfile) {
    this.profiles.set(profile.id, profile);
  }

  getById(id: string): StoredWorkProfile | undefined {
    return this.profiles.get(id);
  }

  list(): StoredWorkProfile[] {
    return Array.from(this.profiles.values());
  }
}

export const workProfilesStore = new WorkProfilesStore();