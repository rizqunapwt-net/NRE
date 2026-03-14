<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens;

    use HasFactory;
    use HasRoles;
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'is_active',
        'must_change_password',
        'password_changed_at',
        'last_login_at',
        'google_id',
        'avatar_url',
        // Phase 2 — Digital Library
        'phone',
        'address',
        'is_verified_author',
        'author_verified_at',
        'author_profile_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'   => 'datetime',
            'password'            => 'hashed',
            'is_active'           => 'boolean',
            'must_change_password' => 'boolean',
            'password_changed_at' => 'datetime',
            'last_login_at'       => 'datetime',
            // Phase 2 — Digital Library
            'is_verified_author'  => 'boolean',
            'author_verified_at'  => 'datetime',
        ];
    }

    // ─── Relationships ───

    /**
     * Get the author profile linked to this user.
     */
    public function author(): HasOne
    {
        return $this->hasOne(Author::class);
    }

    // ─── Digital Library Relationships ───

    public function bookPurchases(): HasMany
    {
        return $this->hasMany(BookPurchase::class);
    }

    public function bookAccess(): HasMany
    {
        return $this->hasMany(BookAccess::class, 'user_id');
    }

    public function accessibleBooks(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'book_access', 'user_id', 'book_id')
            ->wherePivot('is_active', true)
            ->withPivot(['access_level', 'granted_by', 'granted_at', 'expires_at']);
    }

    public function savedSearches(): HasMany
    {
        return $this->hasMany(SavedSearch::class);
    }

    // ─── Role Helpers ───

    public function isAdmin(): bool
    {
        return $this->hasRole('Admin');
    }

    /**
     * Cek apakah user adalah User (bukan Admin).
     */
    public function isUser(): bool
    {
        return $this->hasRole('User');
    }

    /**
     * Cek apakah user adalah penulis terverifikasi.
     * Menggantikan isAuthor() yang berbasis role.
     */
    public function isVerifiedAuthor(): bool
    {
        return $this->is_verified_author === true;
    }

    /**
     * Backward compatibility — tetap bisa pakai isAuthor()
     */
    public function isAuthor(): bool
    {
        return $this->isVerifiedAuthor();
    }

    public function isPenulis(): bool
    {
        return $this->isVerifiedAuthor();
    }
}
