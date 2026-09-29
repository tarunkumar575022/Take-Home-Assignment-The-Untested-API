const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API', () => {
    beforeEach(() => {
        taskService._reset();
    });

    describe('GET /tasks', () => {
        test('returns all tasks', async () => {
            taskService.create({ title: 'Task 1' });
            taskService.create({ title: 'Task 2' });

            const response = await request(app).get('/tasks');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
        });

        test('filters tasks by status', async () => {
            taskService.create({ title: 'Todo', status: 'todo' });
            taskService.create({ title: 'Working', status: 'in_progress' });

            const response = await request(app)
                .get('/tasks')
                .query({ status: 'todo' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].title).toBe('Todo');
        });

        test('supports pagination', async () => {
            for (let i = 1; i <= 15; i++) {
                taskService.create({ title: `Task ${i}` });
            }

            const response = await request(app)
                .get('/tasks')
                .query({ page: 2, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(5);
            expect(response.body[0].title).toBe('Task 11');
        });
    });

    describe('POST /tasks', () => {
        test('creates a task', async () => {
            const response = await request(app)
                .post('/tasks')
                .send({
                    title: 'New Task',
                    description: 'Test API',
                    priority: 'high',
                });

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('New Task');
            expect(response.body.priority).toBe('high');
            expect(response.body.status).toBe('todo');
            expect(response.body.id).toEqual(expect.any(String));
        });

        test('rejects a task without a title', async () => {
            const response = await request(app)
                .post('/tasks')
                .send({
                    description: 'Missing title',
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(
                'title is required and must be a non-empty string'
            );
        });

        test('rejects an invalid priority', async () => {
            const response = await request(app)
                .post('/tasks')
                .send({
                    title: 'Invalid task',
                    priority: 'urgent',
                });

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /tasks/:id', () => {
        test('updates an existing task', async () => {
            const task = taskService.create({ title: 'Old title' });

            const response = await request(app)
                .put(`/tasks/${task.id}`)
                .send({
                    title: 'Updated title',
                    priority: 'high',
                });

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Updated title');
            expect(response.body.priority).toBe('high');
        });

        test('returns 404 for a missing task', async () => {
            const response = await request(app)
                .put('/tasks/missing-id')
                .send({
                    title: 'Updated',
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Task not found');
        });
    });

    describe('DELETE /tasks/:id', () => {
        test('deletes an existing task', async () => {
            const task = taskService.create({ title: 'Delete me' });

            const response = await request(app).delete(`/tasks/${task.id}`);

            expect(response.status).toBe(204);

            const remaining = taskService.getAll();
            expect(remaining).toHaveLength(0);
        });

        test('returns 404 for a missing task', async () => {
            const response = await request(app).delete('/tasks/missing-id');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Task not found');
        });
    });

    describe('PATCH /tasks/:id/complete', () => {
        test('completes an existing task', async () => {
            const task = taskService.create({
                title: 'Complete me',
                priority: 'high',
            });

            const response = await request(app)
                .patch(`/tasks/${task.id}/complete`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('done');
            expect(response.body.priority).toBe('medium');
            expect(response.body.completedAt).toEqual(expect.any(String));
        });

        test('returns 404 for a missing task', async () => {
            const response = await request(app)
                .patch('/tasks/missing-id/complete');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Task not found');
        });
    });

    describe('GET /tasks/stats', () => {
        test('returns task statistics', async () => {
            taskService.create({ title: 'Todo', status: 'todo' });
            taskService.create({ title: 'Working', status: 'in_progress' });
            taskService.create({ title: 'Done', status: 'done' });

            const response = await request(app).get('/tasks/stats');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                todo: 1,
                in_progress: 1,
                done: 1,
                overdue: 0,
            });
        });
    });
    describe('PATCH /tasks/:id/assign', () => {
        test('assigns an existing task to a user', async () => {
            const createResponse = await request(app)
                .post('/tasks')
                .send({ title: 'Assign me' });

            const taskId = createResponse.body.id;

            const response = await request(app)
                .patch(`/tasks/${taskId}/assign`)
                .send({ assignee: 'Tarun' });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(taskId);
            expect(response.body.assignee).toBe('Tarun');
        });

        test('returns 404 when the task does not exist', async () => {
            const response = await request(app)
                .patch('/tasks/missing-id/assign')
                .send({ assignee: 'Tarun' });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Task not found' });
        });

        test('rejects an empty assignee', async () => {
            const createResponse = await request(app)
                .post('/tasks')
                .send({ title: 'Assign me' });

            const taskId = createResponse.body.id;

            const response = await request(app)
                .patch(`/tasks/${taskId}/assign`)
                .send({ assignee: '   ' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'assignee must be a non-empty string',
            });
        });
    });
});