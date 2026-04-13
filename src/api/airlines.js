import client from './client'

export const getAirlines    = ()         => client.get('/api/airlines').then(r => r.data)
export const createAirline  = (data)     => client.post('/api/airlines', data).then(r => r.data)
export const updateAirline  = (id, data) => client.put(`/api/airlines/${id}`, data).then(r => r.data)
export const deleteAirline  = (id)       => client.delete(`/api/airlines/${id}`)
