import { AppError, BadRequestError, NotFoundError, InternalError } from '../errors';

describe('AppError', () => {
  it('creates an error with the correct status code', () => {
    const err = new AppError('test error', 418);
    expect(err.message).toBe('test error');
    expect(err.statusCode).toBe(418);
    expect(err.isOperational).toBe(true);
  });
});

describe('BadRequestError', () => {
  it('has status 400', () => {
    const err = new BadRequestError();
    expect(err.statusCode).toBe(400);
  });

  it('accepts a custom message', () => {
    const err = new BadRequestError('Invalid input');
    expect(err.message).toBe('Invalid input');
  });
});

describe('NotFoundError', () => {
  it('has status 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });
});

describe('InternalError', () => {
  it('has status 500', () => {
    const err = new InternalError();
    expect(err.statusCode).toBe(500);
  });
});
