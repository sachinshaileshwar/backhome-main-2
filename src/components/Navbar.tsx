import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, LayoutDashboard, LogOut, LogIn } from 'lucide-react';
import logo from '@/assets/logo.png';

const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
      <div className="glass-card rounded-2xl px-8 py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={logo} 
              alt="BackHome Logo" 
              className="w-10 h-10 transition-transform group-hover:scale-110"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              BackHome
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="default" className="text-muted-foreground hover:text-foreground">
                Home
              </Button>
            </Link>
            
            <div className="w-px h-6 bg-border mx-2" />
            
            {user ? (
              <>
                <Link to="/add-item">
                  <Button variant="default" size="default" className="gap-2 font-medium">
                    <Plus className="w-4 h-4" />
                    Report Item
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="secondary" size="default" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="default" 
                  onClick={signOut}
                  className="gap-2 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="default" size="default" className="gap-2 font-medium">
                  <LogIn className="w-4 h-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
