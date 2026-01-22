// src/app/(dashboard)/users/components/user-modal.tsx

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
  createUserSchema,
  updateUserSchema,
  roleLabels,
  roleDescriptions,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validations/user";
import {
  createUserAction,
  updateUserAction,
} from "@/lib/actions/user";

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

type UserModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  departments: Department[];
  onSuccess: (user?: any) => void;
};

export default function UserModal({
  open,
  onOpenChange,
  user,
  departments,
  onSuccess,
}: UserModalProps) {
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: Role.USER,
      departmentId: null,
      ...(isEditing && { isActive: true }),
    },
  });

  const selectedRole = watch("role");
  const selectedDepartmentId = watch("departmentId");
  const isActive = watch("isActive");

  // Charger les données de l'utilisateur à modifier
  useEffect(() => {
    if (user) {
      setValue("email", user.email);
      setValue("name", user.name);
      setValue("role", user.role);
      setValue("departmentId", user.departmentId);
      setValue("isActive", user.isActive);
    } else {
      reset({
        email: "",
        name: "",
        password: "",
        role: Role.USER,
        departmentId: null,
      });
    }
  }, [user, setValue, reset]);

  // Soumettre le formulaire
  const onSubmit = async (data: CreateUserInput | UpdateUserInput) => {
    try {
      let result;

      if (isEditing && user) {
        // Modification
        result = await updateUserAction({
          ...data,
          id: user.id,
        } as UpdateUserInput);
      } else {
        // Création
        result = await createUserAction(data as CreateUserInput);
      }

      if (result.success) {
        toast.success(
          isEditing
            ? "Utilisateur modifié avec succès"
            : "Utilisateur créé avec succès"
        );
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de l'utilisateur"
              : "Créez un nouveau compte utilisateur pour votre entreprise"}
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

          {/* Mot de passe (seulement en création) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">
                Mot de passe <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum 8 caractères requis
              </p>
            </div>
          )}

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
            <Label htmlFor="department">Département</Label>
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
            <p className="text-xs text-muted-foreground">
              Les utilisateurs de type USER doivent être associés à un département
            </p>
          </div>

          {/* Statut actif (seulement en modification) */}
          {isEditing && (
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Statut du compte</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive
                    ? "L'utilisateur peut se connecter et utiliser l'application"
                    : "L'utilisateur ne peut pas se connecter"}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
                disabled={isSubmitting}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 

            type="submit" disabled={isSubmitting} >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}