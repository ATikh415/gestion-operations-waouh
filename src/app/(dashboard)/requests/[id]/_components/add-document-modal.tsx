
// "use client";

// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Loader2, FileText } from "lucide-react";
// import { DocumentType } from "@prisma/client";
// import { toast } from "sonner";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { addDocumentSchema, type AddDocumentInput, documentTypeLabels } from "@/lib/validations/accountant";
// import { addDocumentAction } from "@/lib/actions/accountant";

// type AddDocumentModalProps = {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   purchaseRequestId: string;
//   onSuccess: () => void;
// };

// export default function AddDocumentModal({
//   open,
//   onOpenChange,
//   purchaseRequestId,
//   onSuccess,
// }: AddDocumentModalProps) {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//     reset,
//     setValue,
//     watch,
//   } = useForm<AddDocumentInput>({
//     resolver: zodResolver(addDocumentSchema),
//     defaultValues: {
//       purchaseRequestId,
//       type: DocumentType.INVOICE,
//       name: "",
//       fileUrl: "",
//     },
//   });

//   const selectedType = watch("type");

//   const onSubmit = async (data: AddDocumentInput) => {
//     try {
//       const result = await addDocumentAction({
//         ...data,
//         purchaseRequestId,
//       });

//       if (result.success) {
//         toast.success("Document ajouté avec succès");
//         onSuccess();
//         onOpenChange(false);
//         reset();
//       } else {
//         toast.error(result.error || "Une erreur est survenue");
//       }
//     } catch (error) {
//       toast.error("Une erreur est survenue");
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-125">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <FileText className="h-5 w-5" />
//             Ajouter un document
//           </DialogTitle>
//           <DialogDescription>
//             Ajoutez une facture, un reçu ou tout autre document lié à cet achat
//           </DialogDescription>
//         </DialogHeader>

//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//           {/* Type de document */}
//           <div className="grid gap-2">
//             <Label htmlFor="type">
//               Type de document <span className="text-destructive">*</span>
//             </Label>
//             <Select
//               value={selectedType}
//               onValueChange={(value) => setValue("type", value as DocumentType)}
//               disabled={isSubmitting}
//             >
//               <SelectTrigger id="type">
//                 <SelectValue placeholder="Sélectionner un type" />
//               </SelectTrigger>
//               <SelectContent>
//                 {Object.entries(documentTypeLabels).map(([value, label]) => (
//                   <SelectItem key={value} value={value}>
//                     {label}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             {errors.type && (
//               <p className="text-sm text-destructive">{errors.type.message}</p>
//             )}
//           </div>

//           {/* Nom du document */}
//           <div className="grid gap-2">
//             <Label htmlFor="name">
//               Nom du document <span className="text-destructive">*</span>
//             </Label>
//             <Input
//               id="name"
//               placeholder="Ex: Facture_Fournisseur_A_2026.pdf"
//               {...register("name")}
//               disabled={isSubmitting}
//             />
//             {errors.name && (
//               <p className="text-sm text-destructive">{errors.name.message}</p>
//             )}
//           </div>

//           {/* URL du fichier */}
//           <div className="grid gap-2">
//             <Label htmlFor="fileUrl">
//               URL du fichier <span className="text-destructive">*</span>
//             </Label>
//             <Input
//               id="fileUrl"
//               type="url"
//               placeholder="https://example.com/documents/facture.pdf"
//               {...register("fileUrl")}
//               disabled={isSubmitting}
//             />
//             {errors.fileUrl && (
//               <p className="text-sm text-destructive">{errors.fileUrl.message}</p>
//             )}
//             <p className="text-xs text-muted-foreground">
//               Note : Dans une version complète, vous pourriez intégrer un système
//               d'upload de fichiers (ex: AWS S3, Cloudinary, etc.)
//             </p>
//           </div>

//           <DialogFooter>
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => onOpenChange(false)}
//               disabled={isSubmitting}
//             >
//               Annuler
//             </Button>
//             <Button type="submit" disabled={isSubmitting}>
//               {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               Ajouter le document
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

// src/app/(dashboard)/requests/[id]/components/add-document-modal.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, FileText, Upload, X, CheckCircle } from "lucide-react";
import { DocumentType } from "@prisma/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { addDocumentSchema, type AddDocumentInput, documentTypeLabels } from "@/lib/validations/accountant";
import { addDocumentAction } from "@/lib/actions/accountant";

type AddDocumentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseRequestId: string;
  onSuccess: () => void;
};

export default function AddDocumentModal({
  open,
  onOpenChange,
  purchaseRequestId,
  onSuccess,
}: AddDocumentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<AddDocumentInput>({
    resolver: zodResolver(addDocumentSchema),
    defaultValues: {
      purchaseRequestId,
      type: DocumentType.INVOICE,
      name: "",
      fileUrl: "",
    },
  });

  const selectedType = watch("type");

  // Réinitialiser le formulaire
  const resetForm = () => {
    reset();
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadedFileUrl("");
  };

  // Gérer la sélection du fichier
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Type de fichier non autorisé. Formats acceptés : PDF, JPEG, PNG");
      return;
    }

    // Vérifier la taille (10 MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Fichier trop volumineux. Taille maximale : 10 MB");
      return;
    }

    setSelectedFile(file);
    setValue("name", file.name);

    console.log(file);
    
    // Upload automatique
    await uploadFile(file);
  };

  // Upload le fichier vers l'API
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log({response});
      

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'upload");
      }

      const result = await response.json();

      if (result.success) {
        setUploadProgress(100);
        setUploadedFileUrl(result.data.url);
        setValue("fileUrl", result.data.url);
        
        // Afficher info compression si applicable
        if (result.data.compressed) {
          const saved = ((result.data.originalSize - result.data.size) / result.data.originalSize * 100).toFixed(0);
          toast.success(`Image compressée (${saved}% d'économie)`);
        } else {
          toast.success("Fichier uploadé avec succès");
        }
      } else {
        throw new Error(result.error || "Erreur lors de l'upload");
      }
    } catch (error: any) {
      console.error("Erreur upload:", error);
      toast.error(error.message || "Erreur lors de l'upload");
      setSelectedFile(null);
      setValue("name", "");
    } finally {
      setIsUploading(false);
    }
  };

  // Supprimer le fichier sélectionné
  const removeFile = () => {
    setSelectedFile(null);
    setUploadedFileUrl("");
    setValue("fileUrl", "");
    setValue("name", "");
    setUploadProgress(0);
  };

  const onSubmit = async (data: AddDocumentInput) => {
    if (!uploadedFileUrl) {
      toast.error("Veuillez d'abord uploader un fichier");
      return;
    }

    try {
      const result = await addDocumentAction({
        ...data,
        purchaseRequestId,
      });

      if (result.success) {
        toast.success("Document ajouté avec succès");
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ajouter un document
          </DialogTitle>
          <DialogDescription>
            Ajoutez une facture, un reçu ou tout autre document lié à cet achat
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type de document */}
          <div className="grid gap-2">
            <Label htmlFor="type">
              Type de document <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setValue("type", value as DocumentType)}
              disabled={isSubmitting || isUploading}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Upload fichier */}
          <div className="grid gap-2">
            <Label htmlFor="file">
              Fichier <span className="text-destructive">*</span>
            </Label>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={isSubmitting || isUploading}
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPEG, PNG (max 10 MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {uploadProgress === 100 ? (
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      disabled={isUploading}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {isUploading && (
                  <div className="space-y-1">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      Upload en cours... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nom du document */}
          <div className="grid gap-2">
            <Label htmlFor="name">
              Nom du document <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: Facture_Fournisseur_A_2026.pdf"
              {...register("name")}
              disabled={isSubmitting || isUploading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isUploading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading || !uploadedFileUrl}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter le document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}