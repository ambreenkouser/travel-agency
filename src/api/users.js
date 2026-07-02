import client from './client'

export const getUsers        = ()         => client.get('/api/users').then(r => r.data)
export const getRoles        = ()         => client.get('/api/roles').then(r => r.data)
export const getUserTypes    = ()         => client.get('/api/user-types').then(r => r.data)
export const getAllowedTypes  = ()         => client.get('/api/user-types/allowed').then(r => r.data)
export const createUser      = (data)     => client.post('/api/users', data).then(r => r.data)
export const updateUser      = (id, data) => client.put(`/api/users/${id}`, data).then(r => r.data)
export const toggleActive    = (id)       => client.patch(`/api/users/${id}/toggle-active`).then(r => r.data)
export const deleteUser      = (id)       => client.delete(`/api/users/${id}`)
