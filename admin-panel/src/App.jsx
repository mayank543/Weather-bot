import { useState } from 'react';
import Login from "./components/login"; 
import UserManagement from './components/UserManagement';

function App() {
  const [token, setToken] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow p-4 text-xl font-bold text-center">
        🌤️ Weather Bot Admin Panel
      </header>

      <main className="p-6">
        {!token ? (
          <Login onLogin={setToken} />
        ) : (
          <UserManagement token={token} />
        )}
      </main>
    </div>
  );
}

export default App;