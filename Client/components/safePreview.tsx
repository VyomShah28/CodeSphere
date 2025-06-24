import { useEffect, useState } from "react";

interface FileData {
  type: "input" | "output";
  content?: string;
  filename?: string | undefined;
  file?: File | string;
}

const fetchFileFromURL = async (url: string) => {
  try {
    // Prepend backend URL if it's a relative path
    const fullURL = url.startsWith("http")
      ? url
      : `http://localhost:8000${url}`;

    const response = await fetch(fullURL);

    if (!response.ok) {
      throw new Error(`Failed to fetch file from ${fullURL}`);
    }

    const content = await response.text();
    const filename = fullURL.split("/").pop();

    return { filename, content };
  } catch (error) {
    console.error("File fetch error:", error);
    return null;
  }
};


export const SafePreview = ({ type, file }: FileData) => {
  const [content, setContent] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (typeof file === "string") {
        const fetched = await fetchFileFromURL(file);
        if (fetched) {
          setContent(fetched.content);
          setFilename(fetched.filename?? "");
        }
      } else if (file instanceof File) {
        const reader = new FileReader();
        reader.onload = () => {
          setContent(reader.result as string);
          setFilename(file.name);
        };
        reader.readAsText(file);
      }
    };

    load();
  }, [file]);

  if (!content) return null;

  return (
    <div className="mt-2 border rounded bg-gray-100 p-2 text-sm max-h-40 overflow-auto">
      <strong>
        {type.toUpperCase()} File: {filename}
      </strong>
      <pre className="whitespace-pre-wrap mt-1">{content}</pre>
    </div>
  );
};
