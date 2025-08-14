import { useState } from "react";
import { Button } from "@/components/ui/button";
import { vkAuth } from "@/lib/vk-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function VKLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (vkData: any) => {
      const response = await fetch("/api/auth/vk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vkData),
      });
      
      if (!response.ok) {
        throw new Error("Authentication failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Добро пожаловать!",
        description: "Вы успешно вошли в систему",
      });
      // Redirect to dashboard or reload page
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Ошибка входа",
        description: "Не удалось войти через VK ID. Попробуйте еще раз.",
      });
      console.error("VK login error:", error);
    },
  });

  const handleVKLogin = async () => {
    try {
      setIsLoading(true);
      
      // Initialize VK SDK
      await vkAuth.init();
      
      // Show login widget and get auth data
      const vkData = await vkAuth.showLoginWidget();
      
      // Send auth data to backend
      await loginMutation.mutateAsync(vkData);
      
    } catch (error) {
      console.error("VK authentication error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось подключиться к VK ID",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleVKLogin}
      disabled={isLoading || loginMutation.isPending}
      className="bg-blue-600 hover:bg-blue-700 text-white"
      data-testid="button-vk-login"
    >
      {isLoading || loginMutation.isPending ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      ) : (
        <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
          <path d="M12.785 16.241s.288-.032.436-.186c.136-.142.132-.408.132-.408s-.02-1.247.574-1.43c.586-.18 1.337 1.205 2.134 1.737.602.402 1.06.314 1.06.314l2.13-.029s1.114-.068.586-.922c-.043-.07-.307-.63-1.574-1.781-1.327-1.204-1.149-.01 4.493-3.417 1.125-.856 1.575-1.381 1.435-1.605-.133-.213-.952-.157-.952-.157l-2.4.015s-.178-.024-.31.054c-.13.077-.213.257-.213.257s-.382.99-.891 1.834c-1.073 1.783-1.503 1.877-1.679 1.766-.407-.256-.305-1.031-.305-1.581 0-1.72.268-2.437-.521-2.622-.262-.061-.454-.102-1.123-.109-.859-.008-1.588.003-2 .205-.274.134-.486.434-.357.452.159.022.52.095.711.35.247.33.238.95.238.95s.142 2.028-.331 2.28c-.326.173-.774-.18-1.734-1.79-.492-.831-.864-1.75-.864-1.75s-.072-.171-.2-.263c-.155-.112-.372-.147-.372-.147l-2.278.014s-.342.009-.468.154c-.113.129-.009.394-.009.394s1.796 4.09 3.832 6.15c1.87 1.89 3.99 1.766 3.99 1.766z"/>
        </svg>
      )}
      Войти через VK ID
    </Button>
  );
}