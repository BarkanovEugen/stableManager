import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, UserCheck, Eye, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@shared/schema";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.getElementById("page-title")!.textContent = "Управление пользователями";
  }, []);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: currentUser?.role === "administrator",
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error("Failed to update user role");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "administrator":
        return (
          <Badge className="bg-red-100 text-red-800">
            <Shield className="w-3 h-3 mr-1" />
            Администратор
          </Badge>
        );
      case "instructor":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <UserCheck className="w-3 h-3 mr-1" />
            Инструктор
          </Badge>
        );
      case "observer":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Eye className="w-3 h-3 mr-1" />
            Наблюдатель
          </Badge>
        );
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    if (userId === currentUser?.id) {
      alert("Вы не можете изменить свою собственную роль");
      return;
    }
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  if (currentUser?.role !== "administrator") {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Доступ запрещен</h3>
        <p className="text-muted-foreground">
          Только администраторы могут управлять пользователями
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div data-testid="users-page">
      <div className="mb-6">
        <p className="text-muted-foreground">
          Управление ролями пользователей системы
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Администраторы</p>
                <p className="text-2xl font-bold">
                  {users?.filter(u => u.role === "administrator").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Инструкторы</p>
                <p className="text-2xl font-bold">
                  {users?.filter(u => u.role === "instructor").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-gray-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Наблюдатели</p>
                <p className="text-2xl font-bold">
                  {users?.filter(u => u.role === "observer").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Пользователи системы</CardTitle>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет зарегистрированных пользователей
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`user-row-${user.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium" data-testid={`user-name-${user.id}`}>
                        {user.name}
                        {user.id === currentUser?.id && (
                          <span className="text-sm text-muted-foreground ml-2">(это вы)</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`user-email-${user.id}`}>
                        {user.email || "Email не указан"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        VK ID: {user.vkId}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div data-testid={`user-role-badge-${user.id}`}>
                      {getRoleBadge(user.role)}
                    </div>
                    
                    {user.id !== currentUser?.id && (
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-[160px]" data-testid={`select-role-${user.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="observer">Наблюдатель</SelectItem>
                          <SelectItem value="instructor">Инструктор</SelectItem>
                          <SelectItem value="administrator">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    {user.id === currentUser?.id && (
                      <Button variant="ghost" size="sm" disabled>
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <Settings className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Информация о ролях
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Администратор:</strong> Полный доступ ко всем функциям системы</li>
                <li><strong>Инструктор:</strong> Может создавать и редактировать занятия, управлять клиентами и сертификатами</li>
                <li><strong>Наблюдатель:</strong> Доступ только для просмотра информации</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
