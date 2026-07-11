import downloadFile from "@/lib/downloadFile";
import { toast } from "@/lib/utils";
import { useState } from "react";

const useDownloadFile = () =>
{
    const [isDownloading, setIsDownloading] = useState(false);  
    const [receivedBytes, setReceivedBytes] = useState(0);
    
    const download = async (url: string, filename: string) =>
    {
        console.log(`downloading ${url} to ${filename}`);
        setIsDownloading(true);
        setReceivedBytes(0);
        var res =  await downloadFile(url, filename, setReceivedBytes);
        setIsDownloading(false);
        if (res)
        toast({
            title: "File downloaded",
            description: `Downloaded ${filename} successfully`,
        })
    };
    
    return { download, receivedBytes, isDownloading };
}
export default useDownloadFile;