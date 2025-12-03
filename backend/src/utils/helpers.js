import { randomUUID } from 'crypto';

export const generateId = () => {
  return randomUUID();
};

export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
};

