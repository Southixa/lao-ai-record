'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function TodoList() {
  const [newTodoText, setNewTodoText] = useState('');
  
  // ດຶງຂໍ້ມູນ todos ຈາກ Convex
  const todos = useQuery(api.todos.getTodos);
  
  // ໃຊ້ mutations ຈາກ Convex
  const addTodo = useMutation(api.todos.addTodo);
  const toggleTodo = useMutation(api.todos.toggleTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);

  // ເພີ່ມລາຍການ Todo ໃໝ່
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      await addTodo({ text: newTodoText });
      setNewTodoText('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Todo List with Convex</h1>
      
      <form onSubmit={handleAddTodo} className="mb-6 flex">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="ເພີ່ມລາຍການໃໝ່..."
          className="flex-grow p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 focus:outline-none"
        >
          ເພີ່ມ
        </button>
      </form>

      <div className="space-y-2">
        {todos === undefined ? (
          <div className="text-center">ກຳລັງໂຫລດ...</div>
        ) : todos.length === 0 ? (
          <div className="text-center text-gray-500">ບໍ່ມີລາຍການ todo</div>
        ) : (
          todos.map((todo) => (
            <div key={todo._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo({ id: todo._id, completed: !todo.completed })}
                  className="mr-3 h-5 w-5 text-blue-500"
                />
                <span className={`${todo.completed ? 'line-through text-gray-400' : ''}`}>
                  {todo.text}
                </span>
              </div>
              <button
                onClick={() => deleteTodo({ id: todo._id })}
                className="text-red-500 hover:text-red-700"
              >
                ລຶບ
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 