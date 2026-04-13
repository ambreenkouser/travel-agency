import client from './client'

export const searchFlights  = (params)     => client.get('/api/flights', { params }).then(r => r.data)
export const getFlight      = (id)         => client.get(`/api/flights/${id}`).then(r => r.data)
export const createFlight   = (data)       => client.post('/api/flights', data).then(r => r.data)
export const updateFlight   = (id, data)   => client.put(`/api/flights/${id}`, data).then(r => r.data)
export const deleteFlight   = (id)         => client.delete(`/api/flights/${id}`)
