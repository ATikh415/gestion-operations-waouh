"use client";

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
import {
  createUserSchema,
  roleLabels,
  roleDescriptions,
  type CreateUserInput,
} from "@/lib/validations/user";
import { createUserAction } from "@/lib/actions/user";

type Department = {
  id: string;
  name: string;
  code: string;
};

type CreateUserModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  onSuccess: (user?: any) => void;
};

export default function CreateUserModal({
  open,
  onOpenChange,
  departments,
  onSuccess,
}: CreateUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: Role.USER,
      departmentId: null,
      isActive: true,
    },
  });

  const selectedRole = watch("role");
  const selectedDepartmentId = watch("departmentId");

  const onSubmit = async (data: CreateUserInput) => {
    try {
      const result = await createUserAction(data);

      if (result.success) {
        toast.success("Utilisateur créé avec succès");
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
          <DialogTitle>Nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Créez un nouveau compte utilisateur pour votre entreprise
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

          {/* Mot de passe */}
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
              Créer l'utilisateur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}