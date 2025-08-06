import React, { useState, useRef } from 'react'

export const Slider = ({ 
  value = [0], 
  onValueChange, 
  max = 100, 
  min = 0, 
  step = 1, 
  className = '',
  disabled = false,
  ...props 
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef(null)

  const handleMouseDown = (e) => {
    if (disabled) return
    setIsDragging(true)
    updateValue(e)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || disabled) return
    updateValue(e)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const updateValue = (e) => {
    if (!sliderRef.current) return
    
    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newValue = Math.round((min + percentage * (max - min)) / step) * step
    
    if (onValueChange) {
      onValueChange([newValue])
    }
  }

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  const percentage = ((value[0] - min) / (max - min)) * 100

  return (
    <div 
      ref={sliderRef}
      className={`relative flex w-full touch-none select-none items-center ${className}`}
      onMouseDown={handleMouseDown}
      {...props}
    >
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <div 
          className="absolute h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div 
        className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        style={{ 
          left: `calc(${percentage}% - 10px)`,
          position: 'absolute'
        }}
      />
    </div>
  )
}
