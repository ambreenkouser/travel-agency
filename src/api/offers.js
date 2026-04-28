import client from './client'

export const getMyOffers     = ()       => client.get('/api/offers/my').then(r => r.data)
export const getSentOffers   = ()       => client.get('/api/offers/sent').then(r => r.data)
export const getUserOffers   = (userId) => client.get(`/api/offers/user/${userId}`).then(r => r.data)
export const createOffer     = (data)   => client.post('/api/offers', data).then(r => r.data)
export const deactivateOffer = (id)     => client.delete(`/api/offers/${id}`)
