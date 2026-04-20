import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router';

export function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleSwitch = () => {
    const newRole = user?.role === 'admin' ? 'user' : 'admin';
    switchRole(newRole);
    
    // Navigate to appropriate dashboard
    if (newRole === 'admin') {
      navigate('/platform-admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleSwitch}
        className="px-4 py-3 bg-card border-2 border-accent rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
      >
        {user.role === 'admin' ? (
          <>
            <User className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-foreground">Switch to User View</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-foreground">Switch to Admin View</span>
          </>
        )}
      </button>
    </div>
  );
}
