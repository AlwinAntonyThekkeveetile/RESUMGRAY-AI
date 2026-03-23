import {Link, useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

export const meta = () => ([
    { title: 'Resumgray | Review ' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

interface ResumeData {
    id: string;
    resumePath: string;
    imagePath: string;
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    feedback: Feedback | string;
}

const Resume = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');
    const navigate = useNavigate();

    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading])

    useEffect(() => {
        const loadResume = async () => {
            try {
                setLoadingState('loading');
                const resume = await kv.get(`resume:${id}`);

                if(!resume) {
                    setLoadingState('error');
                    return;
                }

                const data: ResumeData = JSON.parse(resume);
                setResumeData(data);

                // Load PDF
                if (data.resumePath) {
                    const resumeBlob = await fs.read(data.resumePath);
                    if(resumeBlob) {
                        const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
                        setResumeUrl(URL.createObjectURL(pdfBlob));
                    }
                }

                // Load image
                if (data.imagePath) {
                    const imageBlob = await fs.read(data.imagePath);
                    if(imageBlob) {
                        setImageUrl(URL.createObjectURL(imageBlob));
                    }
                }

                // Handle feedback: could be an object, a JSON string, or empty
                let parsed: Feedback | null = null;
                if (data.feedback && typeof data.feedback === 'object') {
                    parsed = data.feedback as Feedback;
                } else if (typeof data.feedback === 'string' && data.feedback.trim().length > 0) {
                    try {
                        parsed = JSON.parse(data.feedback);
                    } catch {
                        console.error("Feedback stored as invalid JSON string:", data.feedback);
                    }
                }

                if (parsed) {
                    console.log("Feedback loaded:", parsed);
                    setFeedback(parsed);
                } else {
                    console.warn("No valid feedback found in KV data:", data);
                }

                setLoadingState('loaded');
            } catch (err) {
                console.error("Failed to load resume data:", err);
                setLoadingState('error');
            }
        }

        loadResume();
    }, [id]);

    const renderLeftPanel = () => {
        if (loadingState === 'loading') {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-4 text-gray-400">
                        <svg className="animate-spin w-10 h-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        <p className="text-sm font-medium text-gray-500">Loading resume...</p>
                    </div>
                </div>
            );
        }

        if (imageUrl && resumeUrl) {
            return (
                <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer" title="Click to open full PDF">
                        <img
                            src={imageUrl}
                            className="w-full h-full object-contain rounded-2xl"
                            title="resume"
                        />
                    </a>
                    {/* Open PDF button */}
                    <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open full PDF
                    </a>
                </div>
            );
        }

        return null;
    };

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="back" className="w-4 h-4" />
                    <span className="max-sm:hidden">Back to Homepage</span>
                </Link>
                
                <Link to="/upload" className="primary-button !w-auto flex items-center gap-2 px-6 py-2">
                    <img src="/icons/sparkles.svg" alt="analyze" className="w-4 h-4 brightness-0 invert" />
                    <span>Analyze Another Resume</span>
                </Link>
            </nav>

            {loadingState === 'error' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
                    <div className="text-6xl">😕</div>
                    <h2 className="text-2xl font-bold text-gray-800">Resume Not Found</h2>
                    <p className="text-gray-500 max-w-md">
                        We couldn't find this resume analysis. It may have been deleted or the link is invalid.
                    </p>
                    <Link to="/upload" className="primary-button !w-auto px-8 py-3">
                        Analyze a New Resume
                    </Link>
                </div>
            )}

            {loadingState !== 'error' && (
                <div className="flex flex-row w-full max-lg:flex-col-reverse relative">
                    {/* Left panel — resume image */}
                    <section className="feedback-section bg-cover bg-center lg:h-[calc(100vh-80px)] lg:sticky lg:top-[80px] items-center justify-center"
                        style={{ backgroundImage: "url('/images/bg-small.svg')" }}>
                        {renderLeftPanel()}
                    </section>

                    {/* Right panel — feedback */}
                    <section className="feedback-section px-4 md:px-8">
                        <h2 className="text-3xl md:text-4xl !text-black font-bold">Resume Review</h2>

                        {loadingState === 'loading' && (
                            <div className="flex flex-col items-center gap-4 py-20">
                                <img src="/images/resume-scan-2.gif" className="w-full max-w-sm" />
                                <p className="text-gray-500 text-sm animate-pulse">Loading your analysis...</p>
                            </div>
                        )}

                        {loadingState === 'loaded' && feedback && (
                            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                                {resumeData?.companyName && (
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 flex gap-4 items-start">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Analyzing for</p>
                                            <p className="text-lg font-bold text-gray-800">{resumeData.jobTitle}</p>
                                            <p className="text-sm text-gray-500">at {resumeData.companyName}</p>
                                        </div>
                                    </div>
                                )}
                                <Summary feedback={feedback} />
                                <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                                <Details feedback={feedback} />

                                {/* Bottom CTA */}
                                <div className="flex flex-col gap-3 pb-10">
                                    <Link to="/upload" className="primary-button text-center py-3">
                                        Analyze Another Resume
                                    </Link>
                                    <Link to="/" className="text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
                                        Go back to Homepage
                                    </Link>
                                </div>
                            </div>
                        )}

                        {loadingState === 'loaded' && !feedback && (
                            <div className="flex flex-col items-center gap-4 py-20 text-center">
                                <div className="text-5xl">⚠️</div>
                                <p className="text-gray-600 font-medium">Analysis data is missing or corrupted.</p>
                                <Link to="/upload" className="primary-button !w-auto px-8">
                                    Try Again
                                </Link>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </main>
    )
}
export default Resume
