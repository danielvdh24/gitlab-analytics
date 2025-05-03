
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

interface AnalyticsProps {
  data: {
    commits: number;
    contributors: number;
    linesAdded: number;
    linesRemoved: number;
    topFiles: { name: string; changes: number }[];
    timeline: {
      labels: string[];
      data: number[];
    };
  };
}

const AnalyticsDisplay = ({ data }: AnalyticsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Repository Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-muted-foreground text-sm">Total Commits</p>
              <p className="text-3xl font-bold text-primary">{data.commits.toLocaleString()}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-muted-foreground text-sm">Contributors</p>
              <p className="text-3xl font-bold text-primary">{data.contributors}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-muted-foreground text-sm">Lines Added</p>
              <p className="text-3xl font-bold text-green-500">{data.linesAdded.toLocaleString()}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-secondary/50 rounded-lg">
              <p className="text-muted-foreground text-sm">Lines Removed</p>
              <p className="text-3xl font-bold text-red-500">{data.linesRemoved.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Most Changed Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topFiles.map((file, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium truncate max-w-[70%]">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{file.changes} changes</p>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full gradient-purple-blue rounded-full"
                    style={{ 
                      width: `${Math.min(100, (file.changes / Math.max(...data.topFiles.map(f => f.changes))) * 100)}%` 
                    }}
                  />
                </div>
                {index < data.topFiles.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg md:col-span-2">
        <CardHeader>
          <CardTitle>Commit Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {data.timeline.data.map((value, index) => (
              <div key={index} className="flex flex-col items-center justify-end h-full">
                <div 
                  className="w-12 gradient-purple-blue rounded-t-md transition-all hover:opacity-80"
                  style={{ 
                    height: `${(value / Math.max(...data.timeline.data)) * 100}%`,
                    minHeight: '10%'
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">{data.timeline.labels[index]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDisplay;
