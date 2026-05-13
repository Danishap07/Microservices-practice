import { validateOrderInput, validateProductId } from '../validation';

describe('validateOrderInput', () => {
  it('passes for valid input', () => {
    const result = validateOrderInput({ productId: 'p123', quantity: 2 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when productId is missing', () => {
    const result = validateOrderInput({ quantity: 2 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('productId is required and must be a string');
  });

  it('fails when quantity is not a positive integer', () => {
    const result = validateOrderInput({ productId: 'p123', quantity: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('quantity must be a positive integer');
  });

  it('defaults quantity to 1 when missing', () => {
    const result = validateOrderInput({ productId: 'p123' });
    expect(result.valid).toBe(true);
  });
});

describe('validateProductId', () => {
  it('passes for valid productId', () => {
    expect(validateProductId('p123').valid).toBe(true);
  });

  it('fails for missing productId', () => {
    expect(validateProductId(undefined).valid).toBe(false);
  });
});
