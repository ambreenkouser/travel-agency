import client from './client'

export const getRoutes    = ()         => client.get('/api/routes').then(r => r.data)
export const createRoute  = (data)     => client.post('/api/routes', data).then(r => r.data)
export const updateRoute  = (id, data) => client.put(`/api/routes/${id}`, data).then(r => r.data)
export const deleteRoute  = (id)       => client.delete(`/api/routes/${id}`)
