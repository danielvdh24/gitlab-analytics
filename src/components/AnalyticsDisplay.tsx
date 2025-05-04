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
  
    const csvContent = [
      headers.join(","),
      ...data.map(row =>
        headers.map(h => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
      )
    ].join("\n");
  
    const csvBlob = new Blob([csvContent], { type: "text/csv" });
    const csvUrl = URL.createObjectURL(csvBlob);
  
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
              margin: 0;
            }
            h2 {
              display: inline-block;
              margin: 0;
              font-size: 1.5rem;
            }
            .header {
              position: sticky;
              top: 0;
              background: white;
              padding: 1rem 2rem;
              z-index: 10;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              border-bottom: 1px solid #ccc;
            }
            .download-icon {
              text-decoration: none;
              font-size: 1.4rem;
              color: black;
              line-height: 1;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
              margin-top: 1rem;
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
              position: sticky;
              top: 4.5rem; /* below sticky header */
              background-color: #d4d4d4;
              z-index: 1;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${title}</h2>
            <a href="${csvUrl}" download="${title.replace(/\s+/g, "_")}.csv" class="download-icon" title="Download CSV">⬇</a>
          </div>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
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
