import { useRef, useState } from "react";
import { useUpload } from "@/lib/object-storage";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarCropDialog } from "./avatar-crop-dialog";

interface AvatarUploadProps {
  name: string;
  avatarUrl?: string | null;
  onUploaded: (objectPath: string) => void | Promise<void>;
  size?: "md" | "lg";
}

export function AvatarUpload({ name, avatarUrl, onUploaded, size = "lg" }: AvatarUploadProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const { uploadFile, isUploading } = useUpload({
    onError: () => {
      toast({
        title: "Upload failed",
        description: "We couldn't upload your photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const initial = (name || "?").charAt(0).toUpperCase();
  const dimension = size === "lg" ? "w-28 h-28" : "w-16 h-16";
  const fontSize = size === "lg" ? "text-3xl" : "text-2xl";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please choose an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const closeCrop = () => {
    if (isUploading) return;
    setCropSrc(null);
  };

  const handleCropConfirm = async (blob: Blob) => {
    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
    const response = await uploadFile(file);
    if (response) {
      await onUploaded(response.objectPath);
      toast({ title: "Photo updated", description: "Your avatar was uploaded." });
    }
    setCropSrc(null);
  };

  return (
    <div className="relative inline-block">
      <Avatar className={cn(dimension, "shadow-sm shadow-primary/30 border-2 border-border")}>
        {avatarUrl && <AvatarImage src={`/api/storage${avatarUrl}`} alt={name} />}
        <AvatarFallback className={cn("bg-primary text-primary-foreground font-black", fontSize)}>
          {initial}
        </AvatarFallback>
      </Avatar>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label="Change profile photo"
        className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm border-2 border-card hover:bg-primary-hover transition-colors disabled:opacity-60"
      >
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {cropSrc && (
        <AvatarCropDialog
          imageSrc={cropSrc}
          open={!!cropSrc}
          onClose={closeCrop}
          onConfirm={handleCropConfirm}
          isSaving={isUploading}
        />
      )}
    </div>
  );
}
