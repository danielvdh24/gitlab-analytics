import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

interface CsvAnalyticsDisplayProps {
  issues: Record<string, string>[];
  mergeRequests: Record<string, string>[];
  comments: Record<string, string>[];
}

const AnalyticsDisplay = ({ issues, mergeRequests, comments }: CsvAnalyticsDisplayProps) => {
  useEffect(() => {
    console.log("Issues:", issues);
    console.log("Merge Requests:", mergeRequests);
    console.log("Comments:", comments);
  }, [issues, mergeRequests, comments]);

  const openTableInNewTab = (data: Record<string, string>[], title: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]);

    const tableHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: sans-serif;
              padding: 2rem;
              background-color: white;
              color: black;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: auto;
              font-size: 14px;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
              vertical-align: top;
              white-space: pre-wrap;
              word-wrap: break-word;
              max-width: 400px;
            }
            th {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${headers.map(h => `<td>${(row[h] || "").replace(/\n/g, "<br>")}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(tableHtml);
      win.document.close();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">Project Data</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-6 flex flex-col items-center space-y-4">
          <div className="flex justify-center gap-4">
            <Button onClick={() => openTableInNewTab(issues, "Issues")}>Issues</Button>
            <Button onClick={() => openTableInNewTab(mergeRequests, "Merge Requests")}>Merge Requests</Button>
            <Button onClick={() => openTableInNewTab(comments, "Comments")}>Comments</Button>
          </div>
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
