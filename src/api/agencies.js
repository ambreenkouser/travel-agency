import client from './client'

export const getAgencies   = ()        => client.get('/api/agencies').then(r => r.data)
export const getAgency     = (id)      => client.get(`/api/agencies/${id}`).then(r => r.data)
export const createAgency  = (data)    => client.post('/api/agencies', data).then(r => r.data)
export const updateAgency  = (id, data)=> client.put(`/api/agencies/${id}`, data).then(r => r.data)
export const deleteAgency  = (id)      => client.delete(`/api/agencies/${id}`)
export const uploadAgencyLogo = (id, formData) => client.post(`/api/agencies/${id}/logo`, formData)
export const agencyLogoUrl    = (id)           => `/api/agencies/${id}/logo`
export const getBranding   = ()        => client.get('/api/branding').then(r => r.data)
