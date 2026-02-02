"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  updateUserSchema,
  roleLabels,
  roleDescriptions,
  type UpdateUserInput,
} from "@/lib/validations/user";
import { updateUserAction } from "@/lib/actions/user";

type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  departmentId: string | null;
  isActive: boolean;
};

type Department = {
  id: string;
  name: string;
  code: string;
};

type UpdateUserModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  departments: Department[];
  onSuccess: (user?: any) => void;
};

export default function UpdateUserModal({
  open,
  onOpenChange,
  user,
  departments,
  onSuccess,
}: UpdateUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: "",
      name: "",
      role: Role.USER,
      departmentId: null,
      isActive: true,
    },
  });

  const selectedRole = watch("role");
  const selectedDepartmentId = watch("departmentId");
  const isActive = watch("isActive");

  // Charger les données de l'utilisateur
  useEffect(() => {
    if (user) {
      setValue("email", user.email);
      setValue("name", user.name);
      setValue("role", user.role);
      setValue("departmentId", user.departmentId);
      setValue("isActive", user.isActive);
    }
  }, [user, setValue]);

  const onSubmit = async (data: UpdateUserInput) => {
    try {
      const result = await updateUserAction({
        ...data,
        id: user.id,
      });

      if (result.success) {
        toast.success("Utilisateur modifié avec succès");
        onSuccess(result.data);
        onOpenChange(false);
        reset();
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  const needsDepartment = selectedRole === Role.USER;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-137.5 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'utilisateur
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom complet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: Jean Dupont"
              {...register("name")}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="utilisateur@entreprise.sn"
              {...register("email")}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Rôle */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Rôle <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue("role", value as Role)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <div className="py-1">
                      <p className="font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {roleDescriptions[value as Role]}
                      </p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* Département */}
          <div className="space-y-2">
            <Label htmlFor="department">
              Département {needsDepartment && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={selectedDepartmentId || "none"}
              onValueChange={(value) =>
                setValue("departmentId", value === "none" ? null : value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Sélectionner un département (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Aucun département</span>
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                        {dept.code}
                      </code>
                      <span>{dept.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departmentId && (
              <p className="text-sm text-destructive">
                {errors.departmentId.message}
              </p>
            )}
            {needsDepartment && (
              <p className="text-xs text-amber-600">
                ⚠️ Obligatoire pour les utilisateurs de type USER
              </p>
            )}
          </div>

          {/* Statut actif */}
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Statut du compte</Label>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? "✅ L'utilisateur peut se connecter"
                  : "❌ L'utilisateur ne peut pas se connecter"}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Modifier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}