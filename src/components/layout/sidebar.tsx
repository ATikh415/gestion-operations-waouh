"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Settings,
  BarChart3,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  userRole: Role;
  userName: string;
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();

  // Navigation selon le rôle
  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: [Role.DIRECTEUR, Role.ACHAT, Role.COMPTABLE, Role.USER],
    },
    {
      name: "Demandes d'achat",
      href: "/requests",
      icon: FileText,
      roles: [Role.DIRECTEUR, Role.ACHAT, Role.COMPTABLE, Role.USER],
    },
    {
      name: "Utilisateurs",
      href: "/users",
      icon: Users,
      roles: [Role.DIRECTEUR],
    },
    {
      name: "Départements",
      href: "/departments",
      icon: Building2,
      roles: [Role.DIRECTEUR],
    },
    {
      name: "Rapports",
      href: "/reports",
      icon: BarChart3,
      roles: [Role.DIRECTEUR, Role.COMPTABLE],
    },
    {
      name: "Paramètres",
      href: "/settings",
      icon: Settings,
      roles: [Role.DIRECTEUR],
    },
    {
    name: "Demandes Internes",
    href: "/internal-requests",
    icon: FileText, // ou Receipt
    roles: [Role.ACHAT, Role.DIRECTEUR],
  },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  );

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex h-full w-64 flex-col bg-red-900">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-white">
        <h1 className="text-xl font-bold text-white">Gestion Achats</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-neutral-900"
                  : "text-white hover:bg-white hover:text-neutral-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info & Logout */}
      <div className="border-t border-white p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-white truncate">{userName}</p>
          <p className="text-xs text-gray-400">{userRole}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}