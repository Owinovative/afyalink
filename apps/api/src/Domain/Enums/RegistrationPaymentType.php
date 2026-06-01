<?php

declare(strict_types=1);

namespace Afyalink\Core\Domain\Enums;

enum RegistrationPaymentType: string
{
    case MpesaStk = 'mpesa_stk';
    case PaybillReference = 'paybill_reference';
}
