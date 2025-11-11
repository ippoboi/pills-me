import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  return (
    <div>
      <Avatar>
        <AvatarImage src="/avatar.jpg" />
        <AvatarFallback>DD</AvatarFallback>
      </Avatar>
      <div>
        <p>Hey,</p>
        <h1>Dimitar</h1>
      </div>
    </div>
  );
}
