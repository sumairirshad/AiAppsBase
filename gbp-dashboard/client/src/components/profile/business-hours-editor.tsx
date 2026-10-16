import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BusinessHours, DayHours, WEEK_DAYS } from "@/types/business-profile";

const DAY_LABELS: Record<keyof BusinessHours, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

interface BusinessHoursEditorProps {
  hours: BusinessHours;
  onChange: (day: keyof BusinessHours, patch: Partial<DayHours>) => void;
}

export function BusinessHoursEditor({ hours, onChange }: BusinessHoursEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business hours</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {WEEK_DAYS.map((day) => {
          const dayHours = hours[day];
          return (
            <div
              key={day}
              className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-b-0 last:pb-0"
            >
              <span className="w-24 text-sm font-medium">{DAY_LABELS[day]}</span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!dayHours.isClosed}
                  onCheckedChange={(checked) =>
                    onChange(day, { isClosed: !checked })
                  }
                />
                <Label className="text-xs text-muted-foreground">
                  {dayHours.isClosed ? "Closed" : "Open"}
                </Label>
              </div>
              {!dayHours.isClosed && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={dayHours.openTime}
                    onChange={(event) =>
                      onChange(day, { openTime: event.target.value })
                    }
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={dayHours.closeTime}
                    onChange={(event) =>
                      onChange(day, { closeTime: event.target.value })
                    }
                    className="w-32"
                  />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
