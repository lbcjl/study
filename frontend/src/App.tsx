import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path='/' element={<LandingPage />} />
				{/* 更多路由待添加 */}
			</Routes>
		</BrowserRouter>
	)
}

export default App
