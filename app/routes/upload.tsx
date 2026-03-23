import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {extractJSON, generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        setIsProcessing(true);

        try {
            setStatusText('Uploading the file...');
            const uploadedFiles = await fs.upload([file]);
            if(!uploadedFiles) return setStatusText('Error: Failed to upload file');
            
            // fs.upload usually returns an array in v2, but handle both cases
            const uploadedFile: any = Array.isArray(uploadedFiles) ? uploadedFiles[0] : uploadedFiles;
            if(!uploadedFile?.path) {
                console.error("Upload successful but no path returned:", uploadedFiles);
                return setStatusText('Error: Upload failed to return file path');
            }

            setStatusText('Converting to image...');
            const imageFile = await convertPdfToImage(file);
            if(!imageFile.file) return setStatusText('Error: Failed to convert PDF to image');

            setStatusText('Uploading the image...');
            const uploadedImages = await fs.upload([imageFile.file]);
            if(!uploadedImages) return setStatusText('Error: Failed to upload image');
            
            const uploadedImage: any = Array.isArray(uploadedImages) ? uploadedImages[0] : uploadedImages;
            if(!uploadedImage?.path) {
                console.error("Image upload successful but no path returned:", uploadedImages);
                return setStatusText('Error: Image upload failed to return path');
            }

            setStatusText('Preparing data...');
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName, jobTitle, jobDescription,
                feedback: '',
            }
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText('Analyzing...');
            console.log("Analyzing resume with instructions for:", jobTitle);

            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({ jobTitle, jobDescription }),
                uploadedImage.path
            )
            
            if (!feedback) {
                console.error("AI feedback returned null or undefined");
                return setStatusText('Error: Failed to analyze resume (No response from AI)');
            }

            console.log("AI Response received:", feedback);

            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : Array.isArray(feedback.message.content)
                    ? feedback.message.content[0]?.text ?? ''
                    : String(feedback.message.content ?? '');

            console.log("=== RAW AI FEEDBACK TEXT START ===");
            console.log(feedbackText);
            console.log("=== RAW AI FEEDBACK TEXT END ===");

            const parsedFeedback = extractJSON(feedbackText);
            
            if (!parsedFeedback) {
                console.error("Failed to parse feedback. Raw text:", feedbackText);
                return setStatusText('Error: AI returned unrecognizable format. Check console (F12).');
            }

            data.feedback = parsedFeedback;
            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText('Analysis complete, redirecting...');
            navigate(`/resume/${uuid}`);
        } catch (error: any) {
            console.error("Analysis process failed at step:", statusText);
            console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
            const errorMsg = error?.message || (typeof error === 'string' ? error : 'An unexpected error occurred');
            setStatusText(`Error: ${errorMsg}. See console for details.`);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section px-4">
                <div className="page-heading py-8 md:py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2 className="text-center">{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full max-w-md mx-auto" />
                        </>
                    ) : (
                        <h2 className="text-center">Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-6 mt-8 w-full max-w-2xl mx-auto">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            <button className="primary-button" type="submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload
