import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskHandoffCoordinator } from '../task-handoff-coordinator';

function createHandoff(overrides: Record<string, unknown> = {}) {
  return {
    id: 'handoff-1',
    status: 'needs_human',
    title: 'Need help',
    body: 'Solve captcha',
    reason: 'captcha',
    workspaceId: null,
    tabId: null,
    agentId: 'claude',
    source: 'claude',
    actionLabel: null,
    taskId: 'task-1',
    stepId: 'step-1',
    open: true,
    createdAt: 1,
    updatedAt: 2,
    ...overrides,
  };
}

describe('TaskHandoffCoordinator', () => {
  const taskManager = {
    getTask: vi.fn(),
    getStep: vi.fn(),
    pauseTaskForHandoff: vi.fn(),
    linkStepHandoff: vi.fn(),
    markTaskReadyToResume: vi.fn(),
    resumeTask: vi.fn(),
    clearStepHandoff: vi.fn(),
    respondToApproval: vi.fn(),
  } as any;

  const handoffManager = {
    findOpenByTaskStep: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
  } as any;

  let coordinator: TaskHandoffCoordinator;

  beforeEach(() => {
    vi.clearAllMocks();
    coordinator = new TaskHandoffCoordinator(taskManager, handoffManager);
  });

  it('creates approval handoffs and pauses the linked task step for approval', () => {
    taskManager.getTask.mockReturnValue({ createdBy: 'user', assignedTo: 'claude' });
    handoffManager.create.mockReturnValue(createHandoff({ status: 'waiting_approval', reason: 'approval_required' }));

    const handoff = coordinator.handleApprovalRequest({
      taskId: 'task-1',
      stepId: 'step-1',
      description: 'Delete all rows',
      action: { params: { workspaceId: 'ws-1', tabId: 'tab-1' } },
    });

    expect(handoffManager.create).toHaveBeenCalledWith(expect.objectContaining({
      status: 'waiting_approval',
      workspaceId: 'ws-1',
      tabId: 'tab-1',
      source: 'user',
    }));
    expect(taskManager.pauseTaskForHandoff).toHaveBeenCalledWith('task-1', 'step-1', 'handoff-1', 'approval');
    expect(handoff?.status).toBe('waiting_approval');
  });

  it('marks human-blocked handoffs ready and transitions the task to resumable state', () => {
    const updated = createHandoff({
      status: 'ready_to_resume',
      actionLabel: 'Resume agent',
      body: 'Solve captcha\n\nHuman marked this task ready for the agent to resume.',
    });
    handoffManager.get.mockReturnValue(createHandoff());
    handoffManager.update.mockReturnValue(updated);

    const handoff = coordinator.markReady('handoff-1');

    expect(handoffManager.update).toHaveBeenCalledWith('handoff-1', expect.objectContaining({
      status: 'ready_to_resume',
      open: true,
      actionLabel: 'Resume agent',
    }));
    expect(taskManager.markTaskReadyToResume).toHaveBeenCalledWith('task-1', 'step-1', 'handoff-1');
    expect(handoff?.status).toBe('ready_to_resume');
  });

  it('resumes a linked task and resolves the handoff', () => {
    handoffManager.get.mockReturnValue(createHandoff({ status: 'ready_to_resume' }));
    taskManager.resumeTask.mockReturnValue({ id: 'task-1', status: 'running' });
    handoffManager.update.mockReturnValue(createHandoff({
      status: 'resolved',
      open: false,
      actionLabel: 'Agent resumed',
      resolvedAt: 3,
    }));

    const handoff = coordinator.resume('handoff-1');

    expect(taskManager.resumeTask).toHaveBeenCalledWith('task-1', 'step-1', 'handoff-1');
    expect(handoffManager.update).toHaveBeenCalledWith('handoff-1', expect.objectContaining({
      status: 'resolved',
      open: false,
      actionLabel: 'Agent resumed',
    }));
    expect(taskManager.clearStepHandoff).toHaveBeenCalledWith('task-1', 'step-1', 'handoff-1');
    expect(handoff?.status).toBe('resolved');
  });

  it('approves and rejects waiting handoffs through the linked task step', () => {
    const waiting = createHandoff({ status: 'waiting_approval', reason: 'approval_required' });
    handoffManager.get.mockReturnValue(waiting);
    taskManager.getStep.mockReturnValue({ task: { id: 'task-1' }, step: { id: 'step-1' }, stepIndex: 0 });

    coordinator.approve('handoff-1');
    coordinator.reject('handoff-1');

    expect(taskManager.respondToApproval).toHaveBeenNthCalledWith(1, 'task-1', 'step-1', true);
    expect(taskManager.respondToApproval).toHaveBeenNthCalledWith(2, 'task-1', 'step-1', false);
  });

  it('syncs resolved handoffs by clearing linked step metadata', () => {
    const handoff = createHandoff({ status: 'resolved', open: false });

    coordinator.syncHandoffState(handoff);

    expect(taskManager.clearStepHandoff).toHaveBeenCalledWith('task-1', 'step-1', 'handoff-1');
  });
});
