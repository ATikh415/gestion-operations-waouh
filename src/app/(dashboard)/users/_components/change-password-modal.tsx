// src/app/(dashboard)/users/components/change-password-modal.tsx

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff, Key } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/user";
import { changePasswordAction } from "@/lib/actions/user";

type User = {
  id: string;
  name: string;
  email: string;
};

type ChangePasswordModalProps = {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export default function ChangePasswordModal({
  user,
  onOpenChange,
  onSuccess,
}: ChangePasswordModalProps) {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (user) {
      reset({
        id: user.id,
        newPassword: "",
        confirmPassword: "",
      });
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [user, reset]);

  // Soumettre le formulaire
  const onSubmit = async (data: ChangePasswordInput) => {
    if (!user) return;

    try {
      const result = await changePasswordAction({
        id: user.id,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      if (result.success) {
        toast.success("Mot de passe modifié avec succès");
        onSuccess();
        onOpenChange(false);
        reset();
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  // Vérifier la force du mot de passe
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      return { strength, label: "Faible", color: "text-red-600" };
    } else if (strength <= 3) {
      return { strength, label: "Moyen", color: "text-yellow-600" };
    } else {
      return { strength, label: "Fort", color: "text-green-600" };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword || "");
  const passwordsMatch =
    newPassword &&
    confirmPassword &&
    newPassword === confirmPassword;

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Changer le mot de passe</DialogTitle>
              <DialogDescription>
                Utilisateur : <span className="font-medium">{user?.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              Un nouveau mot de passe sera défini pour cet utilisateur. Il devra
              l'utiliser lors de sa prochaine connexion.
            </AlertDescription>
          </Alert>

          {/* Nouveau mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">
              Nouveau mot de passe <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("newPassword")}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isSubmitting}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
            {newPassword && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Force :</span>
                <span className={`font-medium ${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirmer le mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirmer le mot de passe <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("confirmPassword")}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
            {passwordsMatch && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                ✓ Les mots de passe correspondent
              </p>
            )}
          </div>

          {/* Conseils de sécurité */}
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <p className="text-sm font-medium">Conseils pour un mot de passe sécurisé :</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Au moins 8 caractères (12+ recommandé)</li>
              <li>Mélangez majuscules et minuscules</li>
              <li>Incluez des chiffres et caractères spéciaux</li>
              <li>Évitez les mots du dictionnaire</li>
            </ul>
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
              Modifier le mot de passe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}