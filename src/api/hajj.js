import client from './client'

export const getHajjPackages   = ()          => client.get('/api/hajj-packages').then(r => r.data)
export const getHajjPackage    = (id)        => client.get(`/api/hajj-packages/${id}`).then(r => r.data)
export const createHajjPackage = (data)      => client.post('/api/hajj-packages', data).then(r => r.data)
export const updateHajjPackage = (id, data)  => client.put(`/api/hajj-packages/${id}`, data).then(r => r.data)
export const deleteHajjPackage = (id)        => client.delete(`/api/hajj-packages/${id}`)
export const getHajjShares    = (id)            => client.get(`/api/hajj-packages/${id}/shares`).then(r => r.data)
export const updateHajjShares = (id, agencyIds) => client.put(`/api/hajj-packages/${id}/shares`, agencyIds)
