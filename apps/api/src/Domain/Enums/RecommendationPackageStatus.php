<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum RecommendationPackageStatus: string
{
    case Draft = 'draft';
    case Ready = 'ready';
    case Shared = 'shared';
    case Archived = 'archived';
}
