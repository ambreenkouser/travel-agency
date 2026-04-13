import client from './client'

export async function login(email, password) {
  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', password)
  await client.post('/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return getMe()
}

export async function logout() {
  await client.post('/logout')
}

export async function getMe() {
  const res = await client.get('/api/me')
  return res.data
}

export const updateProfile = (data) => client.patch('/api/me', data).then(r => r.data)
export const changePassword = (data) => client.post('/api/me/change-password', data)
