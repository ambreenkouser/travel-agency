import client from './client'

export const getUmrahPackages  = ()         => client.get('/api/umrah-packages').then(r => r.data)
export const getUmrahPackage   = (id)       => client.get(`/api/umrah-packages/${id}`).then(r => r.data)
export const createUmrahPackage = (data)    => client.post('/api/umrah-packages', data).then(r => r.data)
export const updateUmrahPackage = (id, data)=> client.put(`/api/umrah-packages/${id}`, data).then(r => r.data)
export const deleteUmrahPackage = (id)      => client.delete(`/api/umrah-packages/${id}`)
export const getUmrahShares    = (id)            => client.get(`/api/umrah-packages/${id}/shares`).then(r => r.data)
export const updateUmrahShares = (id, agencyIds) => client.put(`/api/umrah-packages/${id}/shares`, agencyIds)
