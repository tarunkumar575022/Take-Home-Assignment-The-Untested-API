const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create', () => {
    test('creates a task with defaults', () => {
      const task = taskService.create({ title: 'Learn Jest' });

      expect(task).toEqual(
        expect.objectContaining({
          title: 'Learn Jest',
          description: '',
          status: 'todo',
          priority: 'medium',
          dueDate: null,
          completedAt: null,
        })
      );
      expect(task.id).toEqual(expect.any(String));
      expect(task.createdAt).toEqual(expect.any(String));
    });

    test('creates a task with supplied fields', () => {
      const task = taskService.create({
        title: 'Build API',
        description: 'Write tests',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-10-01T00:00:00.000Z',
      });

      expect(task).toEqual(
        expect.objectContaining({
          title: 'Build API',
          description: 'Write tests',
          status: 'in_progress',
          priority: 'high',
          dueDate: '2026-10-01T00:00:00.000Z',
        })
      );
    });
  });

  describe('getAll and findById', () => {
    test('returns all tasks and finds a task by id', () => {
      const first = taskService.create({ title: 'First' });
      const second = taskService.create({ title: 'Second' });

      expect(taskService.getAll()).toHaveLength(2);
      expect(taskService.findById(first.id)).toEqual(first);
      expect(taskService.findById(second.id)).toEqual(second);
      expect(taskService.findById('missing-id')).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    test('returns tasks matching the requested status', () => {
      taskService.create({ title: 'Todo', status: 'todo' });
      taskService.create({ title: 'Working', status: 'in_progress' });
      taskService.create({ title: 'Done', status: 'done' });

      expect(taskService.getByStatus('todo')).toHaveLength(1);
      expect(taskService.getByStatus('in_progress')).toHaveLength(1);
      expect(taskService.getByStatus('done')).toHaveLength(1);
    });
  });

  describe('getPaginated', () => {
    test('returns the first page from the beginning of the task list', () => {
      for (let i = 1; i <= 15; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      const page = taskService.getPaginated(1, 10);

      expect(page).toHaveLength(10);
      expect(page[0].title).toBe('Task 1');
      expect(page[9].title).toBe('Task 10');
    });

    test('returns the second page after the first ten tasks', () => {
      for (let i = 1; i <= 15; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      const page = taskService.getPaginated(2, 10);

      expect(page).toHaveLength(5);
      expect(page[0].title).toBe('Task 11');
    });
  });

  describe('update', () => {
    test('updates an existing task', () => {
      const task = taskService.create({ title: 'Old title' });

      const updated = taskService.update(task.id, {
        title: 'New title',
        priority: 'high',
      });

      expect(updated.title).toBe('New title');
      expect(updated.priority).toBe('high');
      expect(updated.id).toBe(task.id);
    });

    test('returns null for a missing task', () => {
      expect(taskService.update('missing-id', { title: 'New' })).toBeNull();
    });
  });

  describe('remove', () => {
    test('removes an existing task', () => {
      const task = taskService.create({ title: 'Delete me' });

      expect(taskService.remove(task.id)).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    test('returns false for a missing task', () => {
      expect(taskService.remove('missing-id')).toBe(false);
    });
  });

  describe('completeTask', () => {
    test('marks a task as done', () => {
      const task = taskService.create({
        title: 'Finish me',
        priority: 'high',
      });

      const completed = taskService.completeTask(task.id);

      expect(completed.status).toBe('done');
      expect(completed.priority).toBe('medium');
      expect(completed.completedAt).toEqual(expect.any(String));
    });

    test('returns null for a missing task', () => {
      expect(taskService.completeTask('missing-id')).toBeNull();
    });
  });

  describe('getStats', () => {
    test('counts statuses and overdue tasks', () => {
      taskService.create({ title: 'Todo', status: 'todo' });
      taskService.create({ title: 'Working', status: 'in_progress' });
      taskService.create({ title: 'Done', status: 'done' });
      taskService.create({
        title: 'Overdue',
        status: 'todo',
        dueDate: '2020-01-01T00:00:00.000Z',
      });

      expect(taskService.getStats()).toEqual({
        todo: 2,
        in_progress: 1,
        done: 1,
        overdue: 1,
      });
    });
  });
  describe('assignTask', () => {
    test('assigns a task to a user', () => {
      const task = taskService.create({ title: 'Assign me' });

      const updated = taskService.assignTask(task.id, 'Tarun');

      expect(updated.assignee).toBe('Tarun');
      expect(updated.id).toBe(task.id);
    });

    test('returns null for a missing task', () => {
      expect(taskService.assignTask('missing-id', 'Tarun')).toBeNull();
    });
  });

});
