import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],

	// 从根目录读取环境变量（统一管理）
	envDir: '../',

	server: {
		port: 5173,
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
			},
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					'react-vendor': ['react', 'react-dom', 'react-router-dom'],
					'markdown-libs': ['react-markdown', 'remark-gfm'],
					'pdf-libs': ['html2canvas', 'jspdf'],
				},
			},
		},
		chunkSizeWarningLimit: 1000,
	},
})
