import client from './client'

export function getHotels(city) {
  return client.get('/api/hotels', { params: city ? { city } : {} }).then(r => r.data)
}

export function createHotel(data) {
  return client.post('/api/hotels', data).then(r => r.data)
}

export function updateHotel(id, data) {
  return client.put(`/api/hotels/${id}`, data).then(r => r.data)
}

export function deleteHotel(id) {
  return client.delete(`/api/hotels/${id}`)
}
