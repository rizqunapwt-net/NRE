<?php

namespace App\Policies\Concerns;

use App\Models\User;

trait HandlesRoleAccess
{
    protected function isAdmin(User $user): bool
    {
        return $user->hasRole('Admin');
    }
}
