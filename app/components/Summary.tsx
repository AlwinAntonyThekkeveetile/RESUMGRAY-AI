import ScoreGauge from "~/components/ScoreGauge";
import ScoreBadge from "~/components/ScoreBadge";

const CategoryRow = ({ title, score }: { title: string, score: number }) => {
    const barColor = score > 69 ? 'bg-green-500' : score > 49 ? 'bg-yellow-500' : 'bg-red-500';
    const textColor = score > 69 ? 'text-green-600' : score > 49 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div className="flex flex-col gap-1 w-full">
            <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <p className="text-base font-medium text-gray-700">{title}</p>
                    <ScoreBadge score={score} />
                </div>
                <p className={`text-base font-bold ${textColor}`}>{score}<span className="text-gray-400 font-normal">/100</span></p>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
};

const Summary = ({ feedback }: { feedback: Feedback }) => {
    return (
        <div className="bg-white rounded-2xl shadow-md w-full overflow-hidden">
            {/* Header with gauge */}
            <div className="flex flex-row items-center p-6 gap-6 border-b border-gray-100">
                <ScoreGauge score={feedback.overallScore} />
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-gray-800">Overall Resume Score</h2>
                    <p className="text-sm text-gray-500">
                        Based on ATS compatibility, content quality, structure, tone, and skills match.
                    </p>
                </div>
            </div>

            {/* Category scores with progress bars */}
            <div className="flex flex-col gap-4 p-6">
                <CategoryRow title="Tone & Style" score={feedback.toneAndStyle.score} />
                <CategoryRow title="Content" score={feedback.content.score} />
                <CategoryRow title="Structure" score={feedback.structure.score} />
                <CategoryRow title="Skills" score={feedback.skills.score} />
            </div>
        </div>
    );
}
export default Summary;
