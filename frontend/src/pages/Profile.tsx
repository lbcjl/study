import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import './Auth.css' // Reuse basic layout styles

/* Specific styles for profile can go here or inline given simplicity */
const sectionStyle = {
	background: 'white',
	padding: '20px',
	borderRadius: '16px',
	marginBottom: '20px',
	boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
}

const labelStyle = {
	fontWeight: 600,
	color: '#334155',
	marginBottom: '8px',
	display: 'block',
}

const checkboxGrid = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
	gap: '10px',
}

export default function Profile() {
	const { user, updateUser, logout } = useAuth()
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)
	const [showSuccessModal, setShowSuccessModal] = useState(false)

	// Local state for form
	const [nickname, setNickname] = useState(user?.nickname || '')
	const [homeCity, setHomeCity] = useState(user?.preferences?.homeCity || '')
	const [budgetRange, setBudgetRange] = useState(
		user?.preferences?.budgetRange || '不限',
	)

	// Initialize travelStyle strictly as array, handling legacy string data
	const [travelStyle, setTravelStyle] = useState<string[]>(() => {
		const pref = user?.preferences?.travelStyle
		if (Array.isArray(pref)) return pref
		if (typeof pref === 'string' && pref) return [pref]
		return ['休闲']
	})

	const [dietary, setDietary] = useState<string[]>(
		user?.preferences?.dietary || [],
	)
	const [interests, setInterests] = useState<string[]>(
		user?.preferences?.interests || [],
	)

	useEffect(() => {
		if (user) {
			setNickname(user.nickname || '')
			setHomeCity(user.preferences?.homeCity || '')
			setBudgetRange(user.preferences?.budgetRange || '不限')

			// Re-initialize logic for useEffect updates
			const pref = user.preferences?.travelStyle
			if (Array.isArray(pref)) {
				setTravelStyle(pref)
			} else if (typeof pref === 'string' && pref) {
				setTravelStyle([pref])
			} else {
				setTravelStyle(['休闲'])
			}

			setDietary(user.preferences?.dietary || [])
			setInterests(user.preferences?.interests || [])
		}
	}, [user])

	const toggleItem = (
		list: string[],
		setList: (l: string[]) => void,
		item: string,
	) => {
		if (list.includes(item)) {
			setList(list.filter((i) => i !== item))
		} else {
			setList([...list, item])
		}
	}

	const handleSave = async () => {
		setLoading(true)
		try {
			const preferences = {
				homeCity,
				budgetRange,
				travelStyle, // Now sending array
				dietary,
				interests,
			}

			const payload = { preferences }

			await axios.put('/api/auth/profile', payload)

			// Update local context
			updateUser({ ...user!, nickname, preferences })

			// Show Success Modal
			setShowSuccessModal(true)
		} catch (err) {
			console.error(err)
			alert('保存失败，请检查网络')
		} finally {
			setLoading(false)
		}
	}

	const handleLogout = () => {
		logout()
		navigate('/login')
	}

	const handleCloseModal = () => {
		setShowSuccessModal(false)
		navigate('/') // Optional: navigate back to home after save
	}

	return (
		<div
			className='auth-container'
			style={{ alignItems: 'flex-start', paddingTop: '40px' }}
		>
			<div className='auth-card' style={{ maxWidth: '600px' }}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '20px',
					}}
				>
					<h2 className='auth-title' style={{ margin: 0 }}>
						个人偏好设置 ⚙️
					</h2>
					<button
						onClick={() => navigate('/')}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							fontSize: '1.5rem',
						}}
					>
						❌
					</button>
				</div>

				{/* Success Modal Overlay */}
				{showSuccessModal && (
					<div
						style={{
							position: 'fixed',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							zIndex: 1000,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: 'rgba(0, 0, 0, 0.5)',
							backdropFilter: 'blur(4px)',
						}}
						className='animate-fade-in'
					>
						<div
							style={{
								background: 'white',
								borderRadius: '24px',
								padding: '40px',
								maxWidth: '400px',
								width: '90%',
								boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
								textAlign: 'center',
								border: '1px solid #f1f5f9',
							}}
							className='animate-slide-up'
						>
							<div
								style={{
									width: '80px',
									height: '80px',
									background: '#dcfce7',
									borderRadius: '50%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									margin: '0 auto 24px',
								}}
							>
								<span style={{ fontSize: '40px' }}>🎉</span>
							</div>
							<h3
								style={{
									fontSize: '1.5rem',
									fontWeight: 'bold',
									color: '#1e293b',
									marginBottom: '12px',
								}}
							>
								保存成功！
							</h3>
							<p
								style={{
									color: '#64748b',
									marginBottom: '32px',
									lineHeight: '1.6',
								}}
							>
								您的旅行偏好已更新，AI 现在更了解您了。
							</p>
							<button
								onClick={handleCloseModal}
								style={{
									width: '100%',
									background:
										'linear-gradient(135deg, #10b981 0%, #059669 100%)',
									color: 'white',
									padding: '16px',
									borderRadius: '16px',
									border: 'none',
									fontSize: '1.1rem',
									fontWeight: '600',
									cursor: 'pointer',
									boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)',
									transition: 'transform 0.1s',
								}}
								onMouseEnter={(e) =>
									(e.currentTarget.style.transform = 'scale(1.02)')
								}
								onMouseLeave={(e) =>
									(e.currentTarget.style.transform = 'scale(1)')
								}
							>
								好的，去规划行程
							</button>
						</div>
					</div>
				)}

				<div className='auth-form'>
					{/* Header with Avatar */}
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							marginBottom: '20px',
						}}
					>
						<Avatar name={nickname || user?.nickname} size='xl' />
						<div
							style={{
								marginTop: '10px',
								fontSize: '1.2rem',
								fontWeight: 'bold',
							}}
						>
							{nickname || user?.nickname}
						</div>
						<div style={{ color: '#64748b', fontSize: '0.9rem' }}>
							{user?.email}
						</div>
					</div>

					{/* Basic Info */}
					<div style={sectionStyle}>
						<h3 style={{ marginBottom: '15px', color: '#0f172a' }}>基本信息</h3>
						<div className='form-group'>
							<label className='form-label'>账号</label>
							<input
								className='form-input'
								value={user?.email}
								disabled
								style={{ background: '#e2e8f0' }}
							/>
						</div>
						<div className='form-group' style={{ marginTop: '10px' }}>
							<label className='form-label'>昵称</label>
							<input
								className='form-input'
								value={nickname}
								onChange={(e) => setNickname(e.target.value)}
							/>
						</div>
						<div className='form-group' style={{ marginTop: '10px' }}>
							<label className='form-label'>常居城市 (用于默认出发地)</label>
							<input
								className='form-input'
								value={homeCity}
								onChange={(e) => setHomeCity(e.target.value)}
								placeholder='例如：北京'
							/>
						</div>
					</div>

					{/* Preferences */}
					<div style={sectionStyle}>
						<h3 style={{ marginBottom: '15px', color: '#0f172a' }}>旅行偏好</h3>

						<div className='form-group'>
							<label style={labelStyle}>预算范围偏好</label>
							<div className='grid grid-cols-2 gap-3'>
								{[
									{
										value: '不限',
										label: '不限',
										icon: '💸',
										desc: '灵活安排',
									},
									{
										value: '穷游',
										label: '穷游',
										icon: '🎒',
										desc: '高性价比',
									},
									{
										value: '舒适',
										label: '舒适',
										icon: '🏨',
										desc: '中端酒店/餐饮',
									},
									{
										value: '豪华',
										label: '豪华',
										icon: '💎',
										desc: '五星级/高端体验',
									},
								].map((opt) => (
									<button
										key={opt.value}
										type='button'
										onClick={() => setBudgetRange(opt.value)}
										className={`budget-card ${budgetRange === opt.value ? 'active' : ''}`}
									>
										<span className='text-2xl'>{opt.icon}</span>
										<div className='text-left'>
											<div className='font-bold text-sm'>{opt.label}</div>
											<div className='text-xs opacity-70'>{opt.desc}</div>
										</div>
									</button>
								))}
							</div>
						</div>

						<div className='form-group' style={{ marginTop: '15px' }}>
							<label style={labelStyle}>旅行风格 (多选)</label>
							<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
								{[
									'休闲放松',
									'特种兵打卡',
									'文化探索',
									'自然风光',
									'亲子游',
									'美食之旅',
								].map((style) => (
									<button
										key={style}
										type='button'
										onClick={() =>
											toggleItem(travelStyle, setTravelStyle, style)
										}
										style={{
											padding: '6px 12px',
											borderRadius: '20px',
											border: `1px solid ${travelStyle.includes(style) ? '#0ea5e9' : '#cbd5e1'}`,
											background: travelStyle.includes(style)
												? '#e0f2fe'
												: 'white',
											color: travelStyle.includes(style)
												? '#0284c7'
												: '#64748b',
											cursor: 'pointer',
											transition: 'all 0.2s',
										}}
									>
										{style}
									</button>
								))}
							</div>
						</div>

						<div className='form-group' style={{ marginTop: '15px' }}>
							<label style={labelStyle}>饮食禁忌/偏好 (多选)</label>
							<div style={checkboxGrid}>
								{[
									'不吃辣',
									'清真',
									'素食',
									'海鲜过敏',
									'无忌口',
									'喜爱甜食',
								].map((item) => (
									<label
										key={item}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '5px',
											fontSize: '0.9rem',
											cursor: 'pointer',
										}}
									>
										<input
											type='checkbox'
											checked={dietary.includes(item)}
											onChange={() => toggleItem(dietary, setDietary, item)}
										/>
										{item}
									</label>
								))}
							</div>
						</div>

						<div className='form-group' style={{ marginTop: '15px' }}>
							<label style={labelStyle}>兴趣标签 (AI 将重点推荐)</label>
							<div style={checkboxGrid}>
								{[
									'博物馆',
									'爬山',
									'看海',
									'古建筑',
									'夜市',
									'购物',
									'摄影',
									'乐园',
								].map((item) => (
									<label
										key={item}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '5px',
											fontSize: '0.9rem',
											cursor: 'pointer',
										}}
									>
										<input
											type='checkbox'
											checked={interests.includes(item)}
											onChange={() => toggleItem(interests, setInterests, item)}
										/>
										{item}
									</label>
								))}
							</div>
						</div>
					</div>

					<button
						onClick={handleSave}
						className='auth-button'
						disabled={loading}
					>
						{loading ? '保存中...' : '保存偏好设置'}
					</button>

					<button
						onClick={handleLogout}
						className='auth-button'
						style={{
							background: 'transparent',
							border: '1px solid #ef4444',
							color: '#ef4444',
							marginTop: '10px',
						}}
					>
						退出登录
					</button>
				</div>
			</div>
		</div>
	)
}
