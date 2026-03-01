import db from '$lib/server/db';
import { seedAll, clearAll } from '$lib/server/seed';
import type { Actions } from './$types';

export const actions: Actions = {
  seed: async () => {
    seedAll(db);
  },

  clear: async () => {
    clearAll(db);
  },
};
