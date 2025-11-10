export const SUPER_USER_EMAILS = ['suryaz@tinysteps.com'];

export const isSuperUserEmail = (email?: string | null): boolean => {
  if (!email) {
    return false;
  }
  return SUPER_USER_EMAILS.includes(email.toLowerCase());
};
