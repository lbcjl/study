import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './PreferenceReminder.css'

export default function PreferenceReminder() {
	const { user } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		// Only show if user is logged in, has no homeCity, and is NOT on the profile page
		if (
			user &&
			(!user.preferences?.homeCity ||
				user.preferences.homeCity.trim() === '') &&
			location.pathname !== '/profile'
		) {
			// Check if dismissed in this session
			const dismissed = sessionStorage.getItem('preference_reminder_dismissed')
			if (!dismissed) {
				setVisible(true)
			}
		} else {
			setVisible(false)
		}
	}, [user, location.pathname])

	const handleDismiss = () => {
		setVisible(false)
		sessionStorage.setItem('preference_reminder_dismissed', 'true')
	}

	const handleGoToProfile = () => {
		navigate('/profile')
		setVisible(false)
	}

	if (!visible) return null

	return (
		<div className='preference-reminder'>
			<div className='reminder-content'>
				<span className='reminder-icon'>✨</span>
				<div className='reminder-text'>
					<strong>完善个人偏好</strong>
					<p>设置常居城市，让 AI 行程规划更精准！</p>
				</div>
			</div>
			<div className='reminder-actions'>
				<button onClick={handleGoToProfile} className='btn-action'>
					去设置
				</button>
				<button onClick={handleDismiss} className='btn-close' title='关闭'>
					✕
				</button>
			</div>
		</div>
	)
}
