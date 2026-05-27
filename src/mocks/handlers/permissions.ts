import { http, HttpResponse } from 'msw';

interface CustomRoleMock {
  key: string;
  name: string;
  permissions: string[];
}

// In-memory store for custom roles created in this MSW session
const customRoleStore: CustomRoleMock[] = [];

export const permissionsHandlers = [
  // POST /api/settings/roles — create custom role
  http.post('/api/settings/roles', async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      key: string;
      permissions: string[];
    };
    const { name, key, permissions = [] } = body;

    if (customRoleStore.some((r) => r.key === key)) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ROLE_KEY',
            message: `A role with key "${key}" already exists.`,
          },
        },
        { status: 409 },
      );
    }

    const newRole: CustomRoleMock = { key, name, permissions };
    customRoleStore.push(newRole);

    return HttpResponse.json(
      { success: true, data: { key, name, permissions }, meta: {} },
      { status: 201 },
    );
  }),

  // DELETE /api/settings/roles/:key — delete custom role
  http.delete('/api/settings/roles/:key', ({ params }) => {
    const { key } = params as { key: string };
    const index = customRoleStore.findIndex((r) => r.key === key);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Role not found.' } },
        { status: 404 },
      );
    }

    customRoleStore.splice(index, 1);
    return HttpResponse.json({ success: true, data: { key, status: 'deleted' }, meta: {} });
  }),
];
