import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

// Ensure this matches backend User entity
export interface User {
	id: string
	email: string
	nickname?: string
	preferences?: {
		budgetRange?: string
		travelStyle?: string | string[]
		dietary?: string[]
		interests?: string[]
		homeCity?: string
	}
}

interface AuthContextType {
	user: User | null
	login: (token: string, user: User) => void
	logout: () => void
	isAuthenticated: boolean
	isLoading: boolean
	updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const token = localStorage.getItem('token')
		const savedUser = localStorage.getItem('user')
		if (token && savedUser) {
			try {
				setUser(JSON.parse(savedUser))
				axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
			} catch (e) {
				console.error('Failed to parse user from local storage', e)
				localStorage.removeItem('token')
				localStorage.removeItem('user')
			}
		}
		setLoading(false)
	}, [])

	const login = (token: string, userData: User) => {
		localStorage.setItem('token', token)
		localStorage.setItem('user', JSON.stringify(userData))
		axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
		setUser(userData)
	}

	const logout = () => {
		localStorage.removeItem('token')
		localStorage.removeItem('user')
		delete axios.defaults.headers.common['Authorization']
		setUser(null)
	}

	const updateUser = (userData: User) => {
		setUser(userData)
		localStorage.setItem('user', JSON.stringify(userData))
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				login,
				logout,
				isAuthenticated: !!user,
				isLoading: loading,
				updateUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) throw new Error('useAuth must be used within an AuthProvider')
	return context
}
