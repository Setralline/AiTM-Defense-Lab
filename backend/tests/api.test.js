const request = require('supertest');
describe('Backend Sanity Check', () => {
    it('should pass this basic test', () => {
        expect(1 + 1).toBe(2);
    });
});