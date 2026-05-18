<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum InterviewRecommendation: string
{
    case Recommend = 'recommend';
    case RecommendWithConditions = 'recommend_with_conditions';
    case DoNotRecommend = 'do_not_recommend';
}

