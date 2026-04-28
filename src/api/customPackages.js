import client from './client'

export const getCustomPackages        = ()        => client.get('/api/custom-packages').then(r => r.data)
export const getMyCustomPackages      = ()        => client.get('/api/custom-packages/my').then(r => r.data)
export const getCustomPackagesByType  = (typeDefId) => client.get(`/api/custom-packages/by-type/${typeDefId}`).then(r => r.data)
export const getCustomPackage         = (id)      => client.get(`/api/custom-packages/${id}`).then(r => r.data)
export const createCustomPackage      = (data)    => client.post('/api/custom-packages', data).then(r => r.data)
export const updateCustomPackage      = (id, data)=> client.put(`/api/custom-packages/${id}`, data).then(r => r.data)
export const deleteCustomPackage      = (id)      => client.delete(`/api/custom-packages/${id}`)
export const getCustomUserGrants      = (id)      => client.get(`/api/custom-packages/${id}/user-grants`).then(r => r.data)
export const updateCustomUserGrants   = (id, userIds) => client.put(`/api/custom-packages/${id}/user-grants`, userIds)
export const getCustomShares          = (id)      => client.get(`/api/custom-packages/${id}/shares`).then(r => r.data)
export const updateCustomShares       = (id, agencyIds) => client.put(`/api/custom-packages/${id}/shares`, agencyIds)
