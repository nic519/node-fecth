export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">页面未找到</h2>
        <p className="text-gray-600 mb-6">抱歉，您访问的页面不存在。</p>
        <button 
          onClick={() => window.history.back()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          返回上页
        </button>
      </div>
    </div>
  );
} 