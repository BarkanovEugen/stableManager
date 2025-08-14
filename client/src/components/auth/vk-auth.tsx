import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { vkAuth } from "@/lib/vk-auth";
import { useToast } from "@/hooks/use-toast";

interface VKAuthProps {
  onClose: () => void;
}

export default function VKAuth({ onClose }: VKAuthProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleVKAuth = async () => {
    try {
      setIsAuthenticating(true);
      const accessToken = await vkAuth.authenticate();
      await login(accessToken);
      onClose();
      toast({
        title: "Успешная авторизация",
        description: "Добро пожаловать в CRM систему!",
      });
    } catch (error) {
      console.error("VK authentication error:", error);
      toast({
        title: "Ошибка авторизации",
        description: "Не удалось войти через VK ID. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="vk-auth-modal">
        <DialogHeader>
          <DialogTitle className="text-center" data-testid="vk-auth-title">
            Вход через VK ID
          </DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <svg className="w-16 h-16 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zM18.947 17.053c-.439.439-.586.463-1.102.463h-1.707c-.702 0-.913-.566-2.158-1.81-1.089-1.089-1.566-1.217-1.839-1.217-.375 0-.478.103-.478.6v1.652c0 .448-.145.717-1.33.717-1.954 0-4.117-1.183-5.633-3.383-2.278-3.269-2.904-5.724-2.904-6.22 0-.273.103-.526.6-.526h1.707c.448 0 .615.206.787.688.878 2.483 2.344 4.651 2.946 4.651.225 0 .324-.103.324-.668V9.738c-.067-1.114-.653-1.207-.653-1.605 0-.223.183-.439.478-.439h2.687c.375 0 .513.206.513.651v3.498c0 .375.171.513.274.513.225 0 .41-.138.822-.549 1.251-1.404 2.145-3.566 2.145-3.566.12-.274.326-.526.774-.526h1.707c.536 0 .649.274.536.651-.206 1.217-2.465 4.191-2.465 4.191-.188.308-.257.445 0 .72.188.206 1.251 1.217 1.371 1.337.479.479.479.719.479.719s.547 1.228-1.228 1.228z"/>
            </svg>
          </div>
          <p className="text-muted-foreground" data-testid="vk-auth-description">
            Для доступа к CRM системе войдите через ваш VK аккаунт
          </p>
          <Button
            onClick={handleVKAuth}
            disabled={isAuthenticating}
            className="w-full bg-blue-600 hover:bg-blue-700"
            data-testid="button-vk-authenticate"
          >
            {isAuthenticating ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Авторизация...
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0z"/>
                </svg>
                Авторизоваться через VK
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
            data-testid="button-cancel-auth"
          >
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
