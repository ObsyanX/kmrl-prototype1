import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Brain, 
  BarChart3, 
  Calendar, 
  Train, 
  Database, 
  Settings, 
  HelpCircle, 
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Shield,
  Activity,
  Users,
  FileText,
  Cog,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  userRole: string;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ userRole, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navigationGroups = [
    {
      title: "Operations Workflow",
      items: [
        { name: "Dashboard", path: "/", icon: BarChart3, roles: ['operator', 'manager', 'admin', 'analyst'] },
        { name: "Induction Plan", path: "/induction-plan", icon: Calendar, roles: ['operator', 'manager', 'admin'] },
        { name: "What-If Simulator", path: "/simulator", icon: Brain, roles: ['operator', 'manager', 'admin', 'analyst'] },
        { name: "Fleet Status", path: "/fleet-status", icon: Train, roles: ['operator', 'manager', 'admin', 'analyst'] },
      ]
    },
    {
      title: "Data Management", 
      items: [
        { name: "Fitness Certificates", path: "/fitness-certificates", icon: Shield, roles: ['operator', 'manager', 'admin'] },
        { name: "Maintenance Schedule", path: "/maintenance", icon: Cog, roles: ['operator', 'manager', 'admin'] },
        { name: "Branding SLA", path: "/branding-sla", icon: FileText, roles: ['manager', 'admin'] },
        { name: "Performance Metrics", path: "/performance", icon: Activity, roles: ['operator', 'manager', 'admin', 'analyst'] },
        { name: "Staff Availability", path: "/staff-availability", icon: Users, roles: ['operator', 'manager', 'admin'] },
        { name: "Incident Reports", path: "/incidents", icon: AlertTriangle, roles: ['operator', 'manager', 'admin'] },
      ]
    },
    {
      title: "System Administration",
      items: [
        { name: "Algorithm & Rules", path: "/algorithm-rules", icon: Brain, roles: ['admin', 'analyst'] },
        { name: "Data Sources", path: "/data-sources", icon: Database, roles: ['admin'] },
        { name: "User Management", path: "/user-management", icon: Users, roles: ['admin'] },
        { name: "Post-Op Feedback", path: "/feedback", icon: FileText, roles: ['operator', 'manager', 'admin'] },
        { name: "Help & Support", path: "/support", icon: HelpCircle, roles: ['operator', 'manager', 'admin', 'analyst'] },
        { name: "Audit Trail", path: "/audit-trail", icon: Shield, roles: ['manager', 'admin'] },
      ]
    }
  ];

  const getAccessibleItems = (items: any[]) => {
    return items.filter(item => item.roles.includes(userRole));
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    onLogout();
  };

  return (
    <nav className="glass-card border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 glass-card rounded-lg hologram-glow">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-glow">KMRL AI Platform</h1>
                <p className="text-xs text-muted-foreground">Digital Control Tower</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {navigationGroups.map((group) => {
              const accessibleItems = getAccessibleItems(group.items);
              if (accessibleItems.length === 0) return null;
              
              return (
                <div key={group.title} className="relative group">
                  <Button variant="ghost" className="text-xs font-medium text-muted-foreground hover:text-primary">
                    {group.title}
                  </Button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-0 mt-2 w-64 glass-card border border-primary/20 rounded-lg shadow-glow opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="p-2">
                      {accessibleItems.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                              isActive 
                                ? 'bg-primary/20 text-primary shadow-glow' 
                                : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                            }`
                          }
                        >
                          <item.icon className="w-4 h-4" />
                          {item.name}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            
            {/* Search */}
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search platform..."
                className="w-48 pl-10 glass-card border-primary/20 focus:border-primary"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs">
                3
              </Badge>
            </Button>

            {/* User Info & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground">Operations User</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole} Access</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-primary/20 py-4">
            <div className="space-y-4">
              {navigationGroups.map((group) => {
                const accessibleItems = getAccessibleItems(group.items);
                if (accessibleItems.length === 0) return null;
                
                return (
                  <div key={group.title}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {accessibleItems.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                              isActive 
                                ? 'bg-primary/20 text-primary shadow-glow' 
                                : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                            }`
                          }
                        >
                          <item.icon className="w-4 h-4" />
                          {item.name}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              <div className="border-t border-primary/20 pt-4">
                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;