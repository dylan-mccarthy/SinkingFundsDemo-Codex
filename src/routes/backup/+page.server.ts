import type { Actions } from './$types';
import { importBackup } from '$lib/server/backup';

const DEMO_USER_ID = 'demo-user';

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return { error: 'No file provided' };
    }
    try {
      const content = await file.text();
      const data = JSON.parse(content);
      await importBackup(DEMO_USER_ID, data);
      return { success: true };
    } catch (err) {
      return { error: 'Failed to import backup' };
    }
  }
};
