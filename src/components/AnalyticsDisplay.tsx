import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface CsvAnalyticsDisplayProps {
  issues: Record<string, string>[];
  mergeRequests: Record<string, string>[];
  comments: Record<string, string>[];
}

const AnalyticsDisplay = ({ issues, mergeRequests, comments }: CsvAnalyticsDisplayProps) => {
  const [activeTable, setActiveTable] = useState<"issues" | "mergeRequests" | "comments" | null>(null);

  const renderTable = (data: Record<string, string>[]) => (
    <div className="overflow-auto max-h-[600px] border rounded-xl mt-6">
      <Table>
        <TableHeader>
          <TableRow>
            {Object.keys(data[0] || {}).map((key) => (
              <TableHead key={key}>{key}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              {Object.values(row).map((val, i) => (
                <TableCell key={i} className="whitespace-pre-wrap max-w-[400px]">
                  {val}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">Project Data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="flex justify-center gap-4">
            <Button onClick={() => setActiveTable("issues")}>Issues</Button>
            <Button onClick={() => setActiveTable("mergeRequests")}>Merge Requests</Button>
            <Button onClick={() => setActiveTable("comments")}>Comments</Button>
          </div>
          {activeTable === "issues" && renderTable(issues)}
          {activeTable === "mergeRequests" && renderTable(mergeRequests)}
          {activeTable === "comments" && renderTable(comments)}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">GitStats Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            GitStats visualizations will appear here once implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDisplay;
