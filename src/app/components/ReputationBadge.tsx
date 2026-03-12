import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Shield } from 'lucide-react';

interface ReputationBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ReputationBadge({ score, size = 'md', showLabel = true }: ReputationBadgeProps) {
  const getReputationLevel = (score: number) => {
    if (score >= 100) return { label: 'Xuất sắc', color: 'bg-purple-600', textColor: 'text-purple-600' };
    if (score >= 50) return { label: 'Tốt', color: 'bg-green-600', textColor: 'text-green-600' };
    if (score >= 20) return { label: 'Trung bình', color: 'bg-blue-600', textColor: 'text-blue-600' };
    if (score >= 0) return { label: 'Mới', color: 'bg-gray-600', textColor: 'text-gray-600' };
    return { label: 'Cảnh báo', color: 'bg-red-600', textColor: 'text-red-600' };
  };

  const level = getReputationLevel(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className={`inline-flex items-center gap-1 ${level.textColor}`}>
              <Shield className={iconSizes[size]} />
              <span className="font-semibold">{score}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Điểm uy tín: {score} ({level.label})</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`${level.color} text-white ${sizeClasses[size]}`}>
            <Shield className={`${iconSizes[size]} mr-1`} />
            {score}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Điểm uy tín: {score}</p>
            <p className="text-xs">Mức độ: {level.label}</p>
            <div className="text-xs text-gray-300 mt-2 space-y-1">
              <p className="font-semibold">Cách tính điểm:</p>
              <p>✓ Bài viết &gt;1000 upvote: +1</p>
              <p>✓ Bài viết &gt;3000 upvote: +3</p>
              <p>✓ Bài viết &gt;5000 upvote: +5</p>
              <p>✓ Bài viết có bằng chứng được duyệt: +5</p>
              <p>✓ Hoạt động &gt;30 ngày không vi phạm: +3</p>
              <p>✗ Vi phạm quy định: -10</p>
              <p>✗ Bị báo cáo: -10</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}