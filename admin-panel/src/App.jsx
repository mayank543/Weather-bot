import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import UserManagement from './components/UserManagement';
import Dashboard from './components/dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow p-4 text-xl font-bold text-center">
        🌤️ Weather Bot Admin Panel
      </header>

      <main className="p-6">
        <SignedIn>
          
          <UserManagement  />
        </SignedIn>

        <SignedOut>
          {/* Show inline login when not signed in */}
          <div className="flex justify-center items-center h-[70vh]">
            <SignIn />
          </div>
        </SignedOut>
      </main>
    </div>
  );
}

export default App;