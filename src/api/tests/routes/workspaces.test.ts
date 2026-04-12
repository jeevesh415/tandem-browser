import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

import { registerWorkspaceRoutes } from '../../routes/workspaces';
import { createMockContext, createTestApp } from '../helpers';
import type { RouteContext } from '../../context';

describe('Workspace Routes', () => {
  let ctx: RouteContext;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    ctx = createMockContext();
    app = createTestApp(registerWorkspaceRoutes, ctx);
  });

  describe('POST /workspaces/:id/activate', () => {
    it('switches to the requested workspace', async () => {
      const res = await request(app).post('/workspaces/ws-1/activate').send({});

      expect(res.status).toBe(200);
      expect(ctx.workspaceManager.switch).toHaveBeenCalledWith('ws-1');
      expect(res.body).toEqual({
        ok: true,
        workspace: {
          id: 'ws-1',
          name: 'Test',
          icon: 'briefcase',
          color: '#4285f4',
          order: 0,
          isDefault: false,
          tabIds: [],
        },
      });
    });
  });

  describe('POST /workspaces/:id/tabs', () => {
    it('moves a tab into the requested workspace', async () => {
      const res = await request(app)
        .post('/workspaces/ws-1/tabs')
        .send({ tabId: 321 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
      expect(ctx.workspaceManager.moveTab).toHaveBeenCalledWith(321, 'ws-1');
    });

    it('accepts numeric strings for tabId', async () => {
      const res = await request(app)
        .post('/workspaces/ws-1/tabs')
        .send({ tabId: '321' });

      expect(res.status).toBe(200);
      expect(ctx.workspaceManager.moveTab).toHaveBeenCalledWith(321, 'ws-1');
    });

    it('returns 400 when tabId is missing', async () => {
      const res = await request(app)
        .post('/workspaces/ws-1/tabs')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('tabId is required');
      expect(ctx.workspaceManager.moveTab).not.toHaveBeenCalled();
    });

    it('returns 400 when tabId is not numeric', async () => {
      const res = await request(app)
        .post('/workspaces/ws-1/tabs')
        .send({ tabId: 'abc' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('tabId must be a numeric webContents ID');
      expect(ctx.workspaceManager.moveTab).not.toHaveBeenCalled();
    });
  });
});
