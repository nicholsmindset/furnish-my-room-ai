import { Home, Bed, Utensils, UtensilsCrossed, Bath, Briefcase, Trees } from "lucide-react";
import { Card } from "@/components/ui/card";

export type RoomType = "living-room" | "bedroom" | "kitchen" | "dining-room" | "bathroom" | "office" | "outdoor";

interface RoomTypeSelectorProps {
  onRoomTypeSelect: (roomType: RoomType) => void;
  disabled?: boolean;
}

const roomTypes = [
  {
    id: "living-room" as RoomType,
    name: "Living Room",
    description: "Sofas, TV area, entertainment",
    icon: Home,
  },
  {
    id: "bedroom" as RoomType,
    name: "Bedroom",
    description: "Beds, nightstands, relaxation",
    icon: Bed,
  },
  {
    id: "kitchen" as RoomType,
    name: "Kitchen",
    description: "Appliances, island, storage",
    icon: Utensils,
  },
  {
    id: "dining-room" as RoomType,
    name: "Dining Room",
    description: "Table, chairs, chandelier",
    icon: UtensilsCrossed,
  },
  {
    id: "bathroom" as RoomType,
    name: "Bathroom",
    description: "Spa-like, towels, fixtures",
    icon: Bath,
  },
  {
    id: "office" as RoomType,
    name: "Home Office",
    description: "Desk, chair, workspace",
    icon: Briefcase,
  },
  {
    id: "outdoor" as RoomType,
    name: "Outdoor Space",
    description: "Patio, deck, garden",
    icon: Trees,
  },
];

export default function RoomTypeSelector({ onRoomTypeSelect, disabled }: RoomTypeSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-5xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            What type of room is this?
          </h2>
          <p className="text-muted-foreground text-lg">
            Select the room type for optimized furniture placement and staging
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roomTypes.map((room, index) => {
            const Icon = room.icon;
            return (
              <Card
                key={room.id}
                className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-accent group animate-in fade-in slide-in-from-bottom-4 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => !disabled && onRoomTypeSelect(room.id)}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-full bg-primary/10 group-hover:bg-accent/20 transition-colors">
                    <Icon className="w-8 h-8 text-primary group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="font-semibold text-lg">{room.name}</h3>
                  <p className="text-sm text-muted-foreground">{room.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
