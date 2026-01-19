import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Register() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [nickname, setNickname] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const { login } = useAuth() // Auto login after register? Or just redirect
	const navigate = useNavigate()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			// 1. Register
			const registerRes = await axios.post('/api/auth/register', {
				email,
				password,
				nickname,
			})

			// 2. Auto Login
			if (registerRes.data) {
				const loginRes = await axios.post('/api/auth/login', {
					email,
					password,
				})
				const { access_token, user } = loginRes.data
				login(access_token, user)
				navigate('/')
			}
		} catch (err: any) {
			console.error(err)
			const status = err.response?.status
			const msg = err.response?.data?.message

			if (status === 409) {
				setError('该邮箱已被注册，请直接登录。')
			} else {
				setError(
					typeof msg === 'string'
						? msg
						: Array.isArray(msg)
							? msg.join(', ')
							: '注册失败，请检查网络',
				)
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='auth-container'>
			<div className='auth-card'>
				<h2 className='auth-title'>创建新账号 ✨</h2>

				{error && <div className='error-message'>{error}</div>}

				<form onSubmit={handleSubmit} className='auth-form'>
					<div className='form-group'>
						<label className='form-label'>昵称</label>
						<input
							type='text'
							className='form-input'
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
							required
							placeholder='怎么称呼您？'
						/>
					</div>

					<div className='form-group'>
						<label className='form-label'>电子邮箱</label>
						<input
							type='email'
							className='form-input'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder='your@email.com'
						/>
					</div>

					<div className='form-group'>
						<label className='form-label'>密码</label>
						<input
							type='password'
							className='form-input'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							placeholder='至少6位字符'
							minLength={6}
						/>
					</div>

					<button type='submit' className='auth-button' disabled={loading}>
						{loading ? '注册中...' : '注册并登录'}
					</button>
				</form>

				<div className='auth-footer'>
					已有账号?
					<Link to='/login' className='auth-link'>
						直接登录
					</Link>
				</div>
			</div>
		</div>
	)
}
