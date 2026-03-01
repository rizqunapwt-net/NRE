<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteContent extends Model
{
    protected $fillable = [
        'section', 'key', 'value', 'type', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    // ── Scopes ──
    public function scopeSection($query, string $section)
    {
        return $query->where('section', $section);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Helpers ──
    public static function getSection(string $section): array
    {
        return static::active()
            ->section($section)
            ->orderBy('sort_order')
            ->get()
            ->pluck('value', 'key')
            ->toArray();
    }

    public static function getValue(string $section, string $key, $default = null)
    {
        $content = static::active()
            ->where('section', $section)
            ->where('key', $key)
            ->first();

        return $content ? $content->value : $default;
    }

    public static function setValue(string $section, string $key, $value, string $type = 'text'): self
    {
        return static::updateOrCreate(
            ['section' => $section, 'key' => $key],
            ['value' => $value, 'type' => $type]
        );
    }
}
