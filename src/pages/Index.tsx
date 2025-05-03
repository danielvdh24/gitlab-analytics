
import { useState } from 'react';
import UploadButton from '../components/UploadButton';
import LoadingIndicator from '../components/LoadingIndicator';
import AnalyticsDisplay from '../components/AnalyticsDisplay';
import { toast } from '@/hooks/use-toast';

interface AnalyticsData {
  commits: number;
  contributors: number;
  linesAdded: number;
  linesRemoved: number;
  topFiles: { name: string; changes: number }[];
  timeline: {
    labels: string[];
    data: number[];
  };
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setAnalyticsData(null);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // This is a placeholder for actual file processing
      // In a real app, you'd send the file to a server or process it locally
      
      // Mock analytics data
      const mockData: AnalyticsData = {
        commits: 1243,
        contributors: 28,
        linesAdded: 24680,
        linesRemoved: 12340,
        topFiles: [
          { name: 'src/main.js', changes: 456 },
          { name: 'src/components/App.js', changes: 321 },
          { name: 'src/utils/helpers.js', changes: 198 }
        ],
        timeline: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          data: [45, 73, 102, 87, 127]
        }
      };
      
      setAnalyticsData(mockData);
      toast({
        title: "Success",
        description: "Repository analytics generated successfully",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process the repository file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-3 text-center">
          GitLab Export Viewer
        </h1>
        <p className="text-muted-foreground text-xl mb-8 text-center">
          Upload your exported GitLab repository to view analytics
        </p>
        
        <div className="w-full max-w-md">
          <UploadButton onUpload={handleFileUpload} isLoading={isLoading} />
          
          {isLoading && (
            <div className="mt-8 flex justify-center">
              <LoadingIndicator />
            </div>
          )}
        </div>

        {analyticsData && !isLoading && (
          <div className="w-full mt-12">
            <AnalyticsDisplay data={analyticsData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
