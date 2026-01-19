import React from 'react'
import './ConfirmModal.css'

interface ConfirmModalProps {
	isOpen: boolean
	title: string
	message: string
	onConfirm: () => void
	onCancel: () => void
	confirmText?: string
	cancelText?: string
	isDangerous?: boolean // If true, confirm button is red
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
	isOpen,
	title,
	message,
	onConfirm,
	onCancel,
	confirmText = '确定',
	cancelText = '取消',
	isDangerous = false,
}) => {
	if (!isOpen) return null

	return (
		<div className='confirm-modal-overlay'>
			<div className='confirm-modal-content glass-card animate-scale-in'>
				<h3 className='confirm-title'>{title}</h3>
				<p className='confirm-message'>{message}</p>
				<div className='confirm-actions'>
					<button className='btn-cancel' onClick={onCancel}>
						{cancelText}
					</button>
					<button
						className={`btn-confirm ${isDangerous ? 'danger' : ''}`}
						onClick={onConfirm}
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	)
}

export default ConfirmModal
