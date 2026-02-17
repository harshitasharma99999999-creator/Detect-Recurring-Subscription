import { useCallback, useState } from 'react';
import { api } from '../lib/api';
import type { AnalyzeResult } from '../types';

interface UploadZoneProps {
  onAnalyzed: (result: AnalyzeResult) => void;
  onError: (msg: string) => void;
}

export function UploadZone({ onAnalyzed, onError }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const analyzeCsv = useCallback(
    async (content: string) => {
      setAnalyzing(true);
      setProgress(10);
      try {
        setProgress(40);
        const result = await api.upload.analyze(content);
        setProgress(100);
        onAnalyzed(result as AnalyzeResult);
      } catch (err) {
        onError((err as Error).message);
      } finally {
        setAnalyzing(false);
        setProgress(0);
      }
    },
    [onAnalyzed, onError]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        onError('Please upload a CSV file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        analyzeCsv(text);
      };
      reader.readAsText(file);
    },
    [analyzeCsv, onError]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`
        border-2 border-dashed rounded-xl p-8 text-center transition
        ${dragging ? 'border-accent-blue bg-accent-blue/10' : 'border-surface-500 bg-surface-700/50'}
        ${analyzing ? 'pointer-events-none opacity-90' : ''}
      `}
    >
      <input
        type="file"
        accept=".csv"
        onChange={onInputChange}
        className="hidden"
        id="csv-upload"
        disabled={analyzing}
      />
      {analyzing ? (
        <div className="space-y-3">
          <p className="text-gray-300 font-medium">Analyzing your statement...</p>
          <div className="h-2 bg-surface-600 rounded-full overflow-hidden max-w-xs mx-auto">
            <div
              className="h-full bg-accent-blue transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <label htmlFor="csv-upload" className="cursor-pointer block">
          <p className="text-gray-300 font-medium">Drop your bank or card CSV here, or click to browse</p>
          <p className="text-gray-500 text-sm mt-1">Supports Date, Description, Amount columns</p>
        </label>
      )}
    </div>
  );
}
