import client from './client'

export const getLedger        = () => client.get('/api/ledger').then(r => r.data)
export const getBookingLedger = (bookingId) => client.get(`/api/bookings/${bookingId}/ledger`).then(r => r.data)
export const getUserLedger    = (userId) => client.get(`/api/ledger/user/${userId}`).then(r => r.data)
export const createAdjustment = (data) => client.post('/api/ledger/adjustment', data).then(r => r.data)
