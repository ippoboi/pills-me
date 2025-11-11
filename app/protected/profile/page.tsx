import { LogoutButton } from "@/components/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit04FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function ProfilePage() {
  return (
    <div className="mx-auto min-h-screen flex items-center justify-center">
      {/* Profile card */}
      <div className="flex flex-col w-1/3 md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-[32px] ">
        <div className="flex flex-row items-center justify-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src="/avatar.jpg" />
            <AvatarFallback>DD</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-gray-500">Hey,</p>
            <h1 className="text-2xl font-medium">Dimitar</h1>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <Button variant="secondary">
            <HugeiconsIcon
              icon={Edit04FreeIcons}
              strokeWidth={2}
              className="w-4 h-4"
            />
            Edit Profile
          </Button>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
