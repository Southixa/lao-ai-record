import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-md mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Convex Demo</h1>
      
      <p className="mb-6 text-center">
        ຕົວຢ່າງການໃຊ້ງານ Next.js ກັບ Convex ເປັນ backend
      </p>
      
      <div className="flex flex-col space-y-4">
        <Link 
          href="/homepage" 
          className="bg-blue-500 text-white px-4 py-3 rounded text-center hover:bg-blue-600 focus:outline-none"
        >
          ໜ້າຫຼັກ (Homepage)
        </Link>
        
        <Link 
          href="/todolist" 
          className="bg-green-500 text-white px-4 py-3 rounded text-center hover:bg-green-600 focus:outline-none"
        >
          ລາຍການ Todo (Todolist)
        </Link>
      </div>
    </div>
  );
}
