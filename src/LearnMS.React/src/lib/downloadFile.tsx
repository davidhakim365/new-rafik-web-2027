const downloadFile = async (
    fileUrl: string,
    fileName: string,
    receivedBytes: (progress: number) => void
  ): Promise<boolean> => {
    let file;
  
    try {
      console.log(`requesting file picker`);
      
      // Check if showSaveFilePicker is available
      if ('showSaveFilePicker' in window) {
        file = await window.showSaveFilePicker({ suggestedName: fileName });
      } else {
        alert("File picker is not supported in this browser.");
        return false;
      }
    } catch (e) {
      console.log(e);
      return false;
    }
  
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${localStorage.getItem("token")}`);
  
    const response = await fetch(fileUrl, {
      method: 'GET',
      headers
    });
  
    const writable = await file.createWritable();
  
    let totalReceivedBytes = 0;
  
    const progressPipe = new TransformStream({
      transform: (chunk, controller) => {
        totalReceivedBytes += chunk.byteLength;
        receivedBytes(totalReceivedBytes);
        controller.enqueue(chunk);
      }
    });
  
    await response.body?.pipeThrough(progressPipe).pipeTo(writable);
  
    return true;
  };
  
  export default downloadFile;
  