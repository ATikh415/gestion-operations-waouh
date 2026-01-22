"use client";

import { Role } from "@prisma/client";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { roleLabels, roleColors } from "@/lib/permissions";

interface HeaderProps {
  userRole: Role;
  userName: string;
  departmentName?: string | null;
}

export function Header({ userRole, userName, departmentName }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-gray-950">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="w-64 pl-9"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            3
          </span>
        </Button>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-gray-500">{departmentName || "Aucun département"}</p>
          </div>
          <Badge className={roleColors[userRole]}>
            {roleLabels[userRole]}
          </Badge>
        </div>
      </div>
    </header>
  );
}