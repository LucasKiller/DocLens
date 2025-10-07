export const RoleValues = { USER: 'USER', ADMIN: 'ADMIN' } as const;

export type RoleDto = keyof typeof RoleValues;