import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const currentDate = new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 id="page-title" className="text-2xl font-semibold text-gray-900 ml-12 lg:ml-0">
          {/* This will be updated by individual pages */}
        </h2>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" data-testid="button-notifications">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div className="text-sm text-muted-foreground" data-testid="current-date">
            {currentDate}
          </div>
        </div>
      </div>
    </header>
  );
}
