import React from "react";
import { Button } from "@nextui-org/button";

interface TimeFrameSelectorProps {
  timeFrames: string[];
  selectedTimeFrame: string;
  onSelectTimeFrame: (timeFrame: string) => void;
}

const TimeFrameSelector: React.FC<TimeFrameSelectorProps> = ({
  timeFrames,
  selectedTimeFrame,
  onSelectTimeFrame,
}) => {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {timeFrames.map((timeFrame) => (
        <Button
          key={timeFrame}
          variant={selectedTimeFrame === timeFrame ? "faded" : "light"}
          onClick={() => onSelectTimeFrame(timeFrame)}
          color="primary"
          aria-pressed={selectedTimeFrame === timeFrame}
        >
          {timeFrame}
        </Button>
      ))}
    </div>
  );
};

export default TimeFrameSelector;
