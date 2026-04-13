import client from './client'

export const getBanks   = ()      => client.get('/api/banks').then(r => r.data)
export const getAllBanks = ()     => client.get('/api/banks/all').then(r => r.data)
export const createBank = (data)  => client.post('/api/banks', data).then(r => r.data)
export const updateBank = (id, d) => client.put(`/api/banks/${id}`, d).then(r => r.data)
export const deleteBank = (id)    => client.delete(`/api/banks/${id}`)
