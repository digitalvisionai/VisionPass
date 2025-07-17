
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  User, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Staff Log', href: '/staff-log', icon: Users },
    { name: 'Person Log', href: '/person-log', icon: User },
    { name: 'Admin Management', href: '/admin', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error logging out:', error);
        toast({
          title: "Error",
          description: "Failed to log out. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Logged out successfully",
        description: "You have been signed out of the system.",
      });
      
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-slate-900 text-white w-full h-full flex flex-col">
      {/* Mobile Close Button */}
      {isMobile && onClose && (
        <div className="flex justify-end p-4 lg:hidden">
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <img 
              src="/lovable-uploads/f0841480-cafb-4836-8210-6294134bc90d.png" 
              alt="VisionPass Logo" 
              className="h-10 w-10 object-contain"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-lg lg:text-xl font-bold">VisionPass</h1>
            <p className="text-xs lg:text-sm text-slate-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-4">
        <ul className="space-y-1 lg:space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center space-x-2 lg:space-x-3 p-3 lg:p-3 rounded-lg transition-colors touch-manipulation ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 lg:h-5 lg:w-5" />
                  <span className="text-base lg:text-base">{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-2 lg:p-4 border-t border-slate-700">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white touch-manipulation p-3"
        >
          <LogOut className="h-5 w-5 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
          <span className="text-base lg:text-base">Logout</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
