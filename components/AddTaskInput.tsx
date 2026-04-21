'use client';
import { useState, useRef } from 'react';

interface Props {
  onAdd: (title: string) => void;
  placeholder?: string;
}

export default function AddTaskInput({ onAdd, placeholder = '+ 新增任務...' }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className="w-full bg-transparent text-sm text-gray-500 placeholder-gray-400 outline-none py-1 px-1 hover:text-gray-700 focus:text-gray-800"
    />
  );
}
