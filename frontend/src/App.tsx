import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
	Outlet,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ChatInterface from './components/ChatInterface'
import MapTest from './pages/MapTest'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import './App.css'

// Loading component
const Loading = () => (
	<div
		style={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			height: '100vh',
			color: '#64748b',
		}}
	>
		加载中...
	</div>
)

import PreferenceReminder from './components/PreferenceReminder'

// Protected Route Wrapper
const ProtectedRoute = () => {
	const { isAuthenticated, isLoading } = useAuth()
	if (isLoading) return <Loading />
	return isAuthenticated ? (
		<>
			<PreferenceReminder />
			<Outlet />
		</>
	) : (
		<Navigate to='/login' replace />
	)
}

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route path='/login' element={<Login />} />
					<Route path='/register' element={<Register />} />

					<Route element={<ProtectedRoute />}>
						<Route path='/' element={<ChatInterface />} />
						<Route path='/profile' element={<Profile />} />
						<Route path='/test/map' element={<MapTest />} />
					</Route>

					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	)
}

export default App
