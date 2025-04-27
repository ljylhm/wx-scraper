"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  id: string
}

const RadioGroupItem: React.FC<RadioGroupItemProps> = ({
  value,
  id,
  className,
  ...props
}) => {
  // 获取父组件上下文
  const context = React.useContext(RadioContext);
  
  const handleChange = () => {
    context?.onValueChange(value);
  };
  
  return (
    <div className="flex items-center justify-center">
      <input
        type="radio"
        id={id}
        checked={context?.value === value}
        onChange={handleChange}
        className={cn(
          "h-4 w-4 rounded-full border border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500",
          className
        )}
        value={value}
        {...props}
      />
    </div>
  )
}

// 创建上下文
interface RadioContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const RadioContext = React.createContext<RadioContextType | null>(null);

// 修改RadioGroup组件以提供上下文
const RadioGroupWithContext: React.FC<RadioGroupProps> = ({
  value,
  onValueChange,
  className,
  children,
  ...props
}) => {
  return (
    <RadioContext.Provider value={{ value, onValueChange }}>
      <div className={cn("grid gap-2", className)} {...props}>
        {children}
      </div>
    </RadioContext.Provider>
  )
}

export { RadioGroupWithContext as RadioGroup, RadioGroupItem } 