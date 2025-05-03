
import { LoaderCircle } from "lucide-react";

const LoadingIndicator = () => {
  return (
    <div className="flex flex-col items-center">
      <LoaderCircle className="h-12 w-12 text-primary animate-spin" />
      <p className="mt-4 text-muted-foreground animate-pulse-opacity">
        Processing repository data...
      </p>
    </div>
  );
};

export default LoadingIndicator;
