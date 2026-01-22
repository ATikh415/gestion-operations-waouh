"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
} from "@/lib/validations/department";
import {
  createDepartmentAction,
  updateDepartmentAction,
} from "@/lib/actions/department";

type Department = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
};

type DepartmentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  onSuccess: (department?: any) => void;
};

export default function DepartmentModal({
  open,
  onOpenChange,
  department,
  onSuccess,
}: DepartmentModalProps) {
  const isEditing = !!department;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateDepartmentInput | UpdateDepartmentInput>({
    resolver: zodResolver(isEditing ? updateDepartmentSchema : createDepartmentSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      ...(isEditing && { isActive: true }),
    },
  });

  console.log({department});
  console.log({errors});
  

  const isActive = watch("isActive");

  // Charger les données du département à modifier
  useEffect(() => {
    if (department) {
      setValue("name", department.name);
      setValue("code", department.code);
      setValue("description", department.description || "");
      setValue("isActive", department.isActive);
    } else {
      reset({
        name: "",
        code: "",
        description: "",
      });
    }
  }, [department, setValue, reset]);

  // Soumettre le formulaire
  const onSubmit = async (data: CreateDepartmentInput | UpdateDepartmentInput) => {
    
    console.log({isEditing}, {department});
    
    try {
      let result;

      if (isEditing && department) {
        // Modification
        result = await updateDepartmentAction({
          ...data,
          id: department.id,
        } as UpdateDepartmentInput);
      } else {
        // Création
        result = await createDepartmentAction(data as CreateDepartmentInput);
      }

      console.log({result});
      

      if (result.success) {
        toast.success(
          isEditing
            ? "Département modifié avec succès"
            : "Département créé avec succès"
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le département" : "Nouveau département"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations du département"
              : "Créez un nouveau département pour votre entreprise"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: Informatique"
              {...register("name")}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="Ex: IT"
              {...register("code")}
              disabled={isSubmitting}
              className="font-mono"
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Le code doit être unique et en majuscules (ex: IT, RH, FIN)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description du département..."
              rows={3}
              {...register("description")}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Statut actif (seulement en modification) */}
          {isEditing && (
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Statut</Label>
                <p className="text-sm text-muted-foreground">
                  Activer ou désactiver ce département
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
            className=" cursor-pointer"
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className=" cursor-pointer">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}