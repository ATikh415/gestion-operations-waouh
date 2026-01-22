// src/app/(dashboard)/users/components/users-table.tsx

"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Power, Trash2, Key, Shield } from "lucide-react";
import { Role } from "@prisma/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  toggleUserStatusAction,
  deleteUserAction,
} from "@/lib/actions/user";
import { roleLabels } from "@/lib/validations/user";
import ChangePasswordModal from "./change-password-modal";

type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  departmentId: string | null;
  isActive: boolean;
  department: {
    name: string;
    code: string;
  } | null;
  _count: {
    purchaseRequests: number;
    approvals: number;
  };
};

type UsersTableProps = {
  users: User[];
  currentUserId: string;
  onEdit: (user: User) => void;
  onRefresh: () => void;
};

export default function UsersTable({
  users,
  currentUserId,
  onEdit,
  onRefresh,
}: UsersTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null);

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteUserAction({ id });
      if (result.success) {
        toast.success("Utilisateur supprimé avec succès");
        onRefresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    setTogglingId(user.id);
    try {
      const result = await toggleUserStatusAction({
        id: user.id,
        isActive: !user.isActive,
      });
      if (result.success) {
        toast.success(
          `Utilisateur ${result.data.isActive ? "activé" : "désactivé"} avec succès`
        );
        onRefresh();
      } else {
        toast.error(result.error || "Erreur lors du changement de statut");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setTogglingId(null);
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.DIRECTEUR:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case Role.ACHAT:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case Role.COMPTABLE:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case Role.USER:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            <p className="text-sm text-muted-foreground">
              Modifiez vos critères de recherche ou créez un nouvel utilisateur
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Département</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        {user.id === currentUserId && (
                          <Badge variant="outline" className="text-xs mt-1">
                            <Shield className="h-3 w-3 mr-1" />
                            Vous
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getRoleColor(user.role)}>
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.department ? (
                      <div>
                        <p className="font-medium text-sm">{user.department.name}</p>
                        <code className="text-xs text-muted-foreground">
                          {user.department.code}
                        </code>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={user.isActive ? "default" : "secondary"}
                      className={
                        user.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : ""
                      }
                    >
                      {user.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setChangingPasswordUser(user)}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Changer mot de passe
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(user)}
                          disabled={
                            togglingId === user.id || user.id === currentUserId
                          }
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {user.isActive ? "Désactiver" : "Activer"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingId(user.id)}
                          disabled={user.id === currentUserId}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal changement de mot de passe */}
      <ChangePasswordModal
        user={changingPasswordUser}
        onOpenChange={(open) => !open && setChangingPasswordUser(null)}
        onSuccess={onRefresh}
      />
    </>
  );
}