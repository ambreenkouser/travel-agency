import client from './client'

export const getMyAccounts     = ()       => client.get('/api/payment-accounts').then(r => r.data)
export const getParentAccounts = ()       => client.get('/api/payment-accounts/parent').then(r => r.data)
export const createAccount     = (data)   => client.post('/api/payment-accounts', data).then(r => r.data)
export const deleteAccount     = (id)     => client.delete(`/api/payment-accounts/${id}`)
