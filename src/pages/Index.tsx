import { useState } from "react";
import UploadButton from "../components/UploadButton";
import LoadingIndicator from "../components/LoadingIndicator";
import AnalyticsDisplay from "../components/AnalyticsDisplay";
import { toast } from "@/hooks/use-toast";
import Papa from "papaparse";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<{
    issues: Record<string, string>[];
    mergeRequests: Record<string, string>[];
    comments: Record<string, string>[];
  } | null>(null);

  const [gitstatsUrl, setGitstatsUrl] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setCsvData(null);
      setGitstatsUrl(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://gitlab-analytics.onrender.com/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();

      const baseUrl = "https://gitlab-analytics.onrender.com";
      const normalize = (path: string) => path.replace(/^\/+/, "");

      setGitstatsUrl(`${baseUrl}/${normalize(result.files.gitstats)}`);

      // Fetch CSV files
      const [issuesCSV, mergeRequestsCSV, commentsCSV] = await Promise.all([
        fetch(`${baseUrl}/${normalize(result.files.issues)}`).then((res) => res.text()),
        fetch(`${baseUrl}/${normalize(result.files.merge_requests)}`).then((res) => res.text()),
        fetch(`${baseUrl}/${normalize(result.files.comments)}`).then((res) => res.text()),
      ]);

      const parseCSV = (csv: string): Record<string, string>[] => {
        const { data } = Papa.parse<Record<string, string>>(csv, {
          header: true,
          skipEmptyLines: true,
        });
        return data;
      };

      // Set parsed data and GitStats URL
      setCsvData({
        issues: parseCSV(issuesCSV),
        mergeRequests: parseCSV(mergeRequestsCSV),
        comments: parseCSV(commentsCSV),
      });

      if (result.files.gitstats) {
        setGitstatsUrl(`${baseUrl}/${normalize(result.files.gitstats)}`);
      }

      toast({ title: "Success", description: "Repository processed." });
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6">
      <div className="w-full px-4 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-3 text-center">GitLab Export Viewer</h1>
        <p className="text-muted-foreground text-xl mb-8 text-center">
          Upload your exported GitLab repository to view analytics
        </p>

        <div className="w-full max-w-md">
          <UploadButton onUpload={handleFileUpload} isLoading={isLoading} />
          {isLoading && <div className="mt-8"><LoadingIndicator /></div>}
        </div>

        {!isLoading && csvData && (
          <div className="w-full mt-12">
            <AnalyticsDisplay
              issues={csvData.issues}
              mergeRequests={csvData.mergeRequests}
              comments={csvData.comments}
              gitstatsUrl={gitstatsUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
