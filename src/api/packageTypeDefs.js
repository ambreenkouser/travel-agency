import client from './client'

export const getPackageTypeDefs   = ()        => client.get('/api/package-type-defs').then(r => r.data)
export const getPackageTypeDef    = (id)      => client.get(`/api/package-type-defs/${id}`).then(r => r.data)
export const createPackageTypeDef = (data)    => client.post('/api/package-type-defs', data).then(r => r.data)
export const updatePackageTypeDef = (id, data)=> client.put(`/api/package-type-defs/${id}`, data).then(r => r.data)
export const deletePackageTypeDef = (id)      => client.delete(`/api/package-type-defs/${id}`)
