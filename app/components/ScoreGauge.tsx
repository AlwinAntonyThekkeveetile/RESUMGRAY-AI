import { useEffect, useRef, useState } from "react";

const getLabel = (score: number) => {
    if (score >= 85) return { text: "Excellent", color: "text-green-600" };
    if (score >= 70) return { text: "Good", color: "text-blue-600" };
    if (score >= 50) return { text: "Fair", color: "text-yellow-600" };
    return { text: "Needs Work", color: "text-red-500" };
};

const ScoreGauge = ({ score = 0 }: { score: number }) => {
    const [pathLength, setPathLength] = useState(0);
    const pathRef = useRef<SVGPathElement>(null);
    const percentage = score / 100;
    const label = getLabel(score);

    useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, []);

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-44 h-24">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#a78bfa" />
                            <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                    </defs>

                    {/* Background arc */}
                    <path
                        d="M10,50 A40,40 0 0,1 90,50"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                        strokeLinecap="round"
                    />

                    {/* Foreground arc */}
                    <path
                        ref={pathRef}
                        d="M10,50 A40,40 0 0,1 90,50"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={pathLength}
                        strokeDashoffset={pathLength * (1 - percentage)}
                        style={{ transition: "stroke-dashoffset 1s ease" }}
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                    <div className="text-2xl font-bold text-gray-800">{score}</div>
                    <div className="text-xs text-gray-400 -mt-1">/ 100</div>
                </div>
            </div>
            <span className={`text-sm font-semibold mt-1 ${label.color}`}>{label.text}</span>
        </div>
    );
};

export default ScoreGauge;
