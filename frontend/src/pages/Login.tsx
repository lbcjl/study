import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Login() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const { login } = useAuth()
	const navigate = useNavigate()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			// In production, configure baseURL properly. For now assuming proxy.
			const response = await axios.post('/api/auth/login', { email, password })
			const { access_token, user } = response.data

			login(access_token, user)
			navigate('/') // Go to chat
		} catch (err: any) {
			console.error(err)
			const status = err.response?.status
			const msg = err.response?.data?.message

			if (status === 401) {
				setError('账号或密码错误，请检查。')
			} else if (status === 404) {
				setError('服务未找到，请稍后重试。')
			} else {
				setError(
					typeof msg === 'string'
						? msg
						: Array.isArray(msg)
							? msg.join(', ')
							: '登录失败，请检查网络或稍后重试',
				)
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='auth-container'>
			<div className='auth-card'>
				<h2 className='auth-title'>欢迎回来 👋</h2>

				{error && <div className='error-message'>{error}</div>}

				<form onSubmit={handleSubmit} className='auth-form'>
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
							placeholder='••••••••'
						/>
					</div>

					<button type='submit' className='auth-button' disabled={loading}>
						{loading ? '登录中...' : '登录'}
					</button>
				</form>

				<div className='auth-footer'>
					还没有账号?
					<Link to='/register' className='auth-link'>
						立即注册
					</Link>
				</div>
			</div>
		</div>
	)
}
