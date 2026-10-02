export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const isPasswordComplex = (password: unknown): boolean => {
  return typeof password === 'string' && PASSWORD_REGEX.test(password);
};

export const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
