import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Brain, 
  BarChart3, 
  Calendar, 
  Train, 
  Database, 
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
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavbarProps {
  userRole: string;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ userRole, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navigate = useNavigate();

  const navigationGroups = [
    {
      title: "Operations",
      items: [
        { name: "Dashboard", path: "/", icon: BarChart3, roles: ['operator', 'manager', 'admin', 'analyst', 'supervisor'] },
        { name: "Induction Plan", path: "/induction-plan", icon: Calendar, roles: ['operator', 'manager', 'admin', 'supervisor'] },
        { name: "Simulator", path: "/simulator", icon: Brain, roles: ['operator', 'manager', 'admin', 'analyst', 'supervisor'] },
        { name: "Fleet Status", path: "/fleet-status", icon: Train, roles: ['operator', 'manager', 'admin', 'analyst', 'supervisor'] },
      ]
    },
    {
      title: "Data", 
      items: [
        { name: "Fitness Certificates", path: "/fitness-certificates", icon: Shield, roles: ['operator', 'manager', 'admin', 'supervisor'] },
        { name: "Job-Card Status", path: "/job-card-status", icon: Cog, roles: ['operator', 'manager', 'admin', 'supervisor'] },
        { name: "Branding Priorities", path: "/branding-sla", icon: FileText, roles: ['manager', 'admin', 'supervisor'] },
        { name: "Mileage Balancing", path: "/mileage-balancing", icon: Activity, roles: ['operator', 'manager', 'admin', 'analyst', 'supervisor'] },
        { name: "Cleaning", path: "/cleaning-detailing", icon: Users, roles: ['operator', 'manager', 'admin', 'supervisor'] },
        { name: "Stabling", path: "/stabling-geometry", icon: AlertTriangle, roles: ['operator', 'manager', 'admin', 'supervisor'] },
      ]
    },
    {
      title: "Admin",
      items: [
        { name: "Reports", path: "/reports-analytics", icon: BarChart3, roles: ['admin', 'analyst', 'manager', 'supervisor'] },
        { name: "Algorithm", path: "/algorithm-rules", icon: Brain, roles: ['admin', 'analyst', 'supervisor'] },
        { name: "Users", path: "/user-management", icon: Users, roles: ['admin', 'supervisor'] },
        { name: "Feedback", path: "/feedback", icon: FileText, roles: ['operator', 'manager', 'admin', 'supervisor'] },
        { name: "Support", path: "/support", icon: HelpCircle, roles: ['operator', 'manager', 'admin', 'analyst', 'supervisor'] },
        { name: "Data Sources", path: "/data-sources", icon: Database, roles: ['admin', 'supervisor'] },
        { name: "Audit Trail", path: "/audit-trail", icon: Shield, roles: ['manager', 'admin', 'supervisor'] },
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
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo and Brand - Responsive */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <div className="p-1.5 sm:p-2 glass-card rounded-lg hologram-glow">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-base sm:text-lg font-bold text-glow leading-tight">AGAMI</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block truncate max-w-[200px]">
                Metro Induction Control
              </p>
            </div>
          </div>

          {/* Desktop Navigation - Hidden on mobile/tablet */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-2xl mx-4">
            {navigationGroups.map((group) => {
              const accessibleItems = getAccessibleItems(group.items);
              if (accessibleItems.length === 0) return null;
              
              return (
                <div 
                  key={group.title} 
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(group.title)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "text-xs font-medium text-muted-foreground hover:text-primary px-2 xl:px-3",
                      openDropdown === group.title && "text-primary bg-primary/10"
                    )}
                  >
                    {group.title}
                    <ChevronDown className={cn(
                      "w-3 h-3 ml-1 transition-transform",
                      openDropdown === group.title && "rotate-180"
                    )} />
                  </Button>
                  
                  {/* Dropdown Menu - Fixed z-index and background */}
                  <div className={cn(
                    "absolute top-full left-0 mt-1 w-56 glass-card bg-background/95 backdrop-blur-xl",
                    "border border-primary/20 rounded-lg shadow-lg shadow-black/20",
                    "transition-all duration-200 z-[100]",
                    openDropdown === group.title 
                      ? "opacity-100 visible translate-y-0" 
                      : "opacity-0 invisible -translate-y-2"
                  )}>
                    <div className="p-1.5">
                      {accessibleItems.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200",
                              isActive 
                                ? 'bg-primary/20 text-primary font-medium' 
                                : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                            )
                          }
                        >
                          <item.icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
            
            {/* Search - Hidden on small screens */}
            <div className="hidden md:flex relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="w-32 lg:w-40 xl:w-48 pl-8 h-9 text-sm glass-card border-primary/20 focus:border-primary"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 p-0 text-[10px] flex items-center justify-center">
                3
              </Badge>
            </Button>

            {/* User Info - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right hidden md:block">
                <p className="text-xs sm:text-sm font-medium text-foreground leading-tight">User</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 sm:h-9 text-xs sm:text-sm">
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-9 w-9"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation - Slide down panel */}
        <div className={cn(
          "lg:hidden border-t border-primary/20 overflow-hidden transition-all duration-300",
          isMenuOpen ? "max-h-[70vh] py-4" : "max-h-0 py-0"
        )}>
          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            {/* Mobile Search */}
            <div className="relative md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search platform..."
                className="w-full pl-10 glass-card border-primary/20"
              />
            </div>

            {navigationGroups.map((group) => {
              const accessibleItems = getAccessibleItems(group.items);
              if (accessibleItems.length === 0) return null;
              
              return (
                <div key={group.title}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {accessibleItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all",
                            "min-h-[44px]", // Touch-friendly
                            isActive 
                              ? 'bg-primary/20 text-primary font-medium' 
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/20'
                          )
                        }
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate text-xs sm:text-sm">{item.name}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Mobile Logout */}
            <div className="border-t border-primary/20 pt-4 sm:hidden">
              <Button variant="outline" onClick={handleLogout} className="w-full min-h-[44px]">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
