import client from './client'

export const getBookings       = ()              => client.get('/api/bookings').then(r => r.data)
export const getMyBookings     = ()              => client.get('/api/bookings/my').then(r => r.data)
export const getBookingQueue   = ()              => client.get('/api/bookings/queue').then(r => r.data)
export const getBooking        = (id)            => client.get(`/api/bookings/${id}`).then(r => r.data)
export const createBooking     = (data)          => client.post('/api/bookings', data).then(r => r.data)
export const confirmBooking    = (id, comment)   => client.post(`/api/bookings/${id}/confirm`, { comment: comment ?? '' }).then(r => r.data)
export const cancelBooking     = (id, comment)   => client.post(`/api/bookings/${id}/cancel`,  { comment: comment ?? '' }).then(r => r.data)

export const requestCancellation = (id, reason) =>
  client.post(`/api/bookings/${id}/request-cancellation`, { comment: reason ?? '' }).then(r => r.data)

export const getCancellationRequests = () =>
  client.get('/api/bookings/cancellation-requests').then(r => r.data)

export const approveCancellation = (requestId, comment) =>
  client.post(`/api/bookings/cancellation-requests/${requestId}/approve`, { comment: comment ?? '' }).then(r => r.data)

export const rejectCancellation = (requestId, comment) =>
  client.post(`/api/bookings/cancellation-requests/${requestId}/reject`, { comment: comment ?? '' }).then(r => r.data)

export const submitPaymentSlip = (bookingId, formData) =>
  client.post(`/api/bookings/${bookingId}/payment`, formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)

export const getBookingPayment = (bookingId) =>
  client.get(`/api/bookings/${bookingId}/payment`).then(r => r.data)
