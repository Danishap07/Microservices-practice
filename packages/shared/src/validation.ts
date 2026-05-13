export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateOrderInput(body: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (!body.productId || typeof body.productId !== 'string') {
    errors.push('productId is required and must be a string');
  }

  if (body.quantity !== undefined) {
    const qty = Number(body.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      errors.push('quantity must be a positive integer');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateProductId(productId: unknown): ValidationResult {
  const errors: string[] = [];

  if (!productId || typeof productId !== 'string') {
    errors.push('productId is required and must be a string');
  }

  return { valid: errors.length === 0, errors };
}
