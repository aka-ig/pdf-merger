import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';


function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function PdfMerger() {

  const [files, setFiles] = useState<File[]>([]);
  const [fileBuffers, setFileBuffers] = useState<ArrayBuffer[]>([]);
  const [fileName, setFileName] = useState<string>('merged.pdf');

  return (
    <div className='x24-sb-page-pdf container'>
      <h1>PDF Merger</h1>
      <div>
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
        />
        <button onClick={handleMerge}>Merge</button>
        <button onClick={() => { setFiles([]); setFileBuffers([]); }}>Clear</button>
        <div>
          <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Enter file name" />
        </div>
      </div>
      <div>
        <div>
          {files.map((file, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div>{file.name}</div>
              <div><button onClick={() => handleRemoveFile(file)}>X</button></div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(v => [...v, ...selectedFiles]);

      const buffers = selectedFiles.map(file => readFileAsArrayBuffer(file));
      Promise.all(buffers)
        .then(buffers => {
          setFileBuffers(v => [...v, ...buffers]);
        })
        .catch(error => {
          console.error('Error reading files:', error);
        });
    }
  }


  async function handleMerge() {
    if (fileBuffers.length < 2) {
      alert('Please select at least two PDFs.');
      return;
    }

    // Create a new PDFDocument
    const mergedPdf = await PDFDocument.create();

    for (const buffer of fileBuffers) {
      const pdf = await PDFDocument.load(buffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save() as BlobPart;
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }


  function handleRemoveFile(fileToRemove: File) {
    setFiles(files.filter(file => file !== fileToRemove));
  }
}
