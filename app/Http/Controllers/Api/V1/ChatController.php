<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    /**
     * Author: get own messages (conversation with admin)
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Mark admin replies as read when author opens chat
        ChatMessage::where('user_id', $user->id)
            ->where('sender', 'admin')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = ChatMessage::where('user_id', $user->id)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'sender' => $m->sender,
                'message' => $m->message,
                'is_read' => $m->is_read,
                'created_at' => $m->created_at->toISOString(),
            ]);

        return response()->json(['success' => true, 'data' => $messages]);
    }

    /**
     * Author: send a message to admin
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate(['message' => 'required|string|max:2000']);

        $user = Auth::user();

        $msg = ChatMessage::create([
            'user_id' => $user->id,
            'sender' => 'author',
            'message' => $request->message,
            'is_read' => false,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $msg->id,
                'sender' => $msg->sender,
                'message' => $msg->message,
                'is_read' => $msg->is_read,
                'created_at' => $msg->created_at->toISOString(),
            ],
        ], 201);
    }

    /**
     * Author: get unread count (admin replies not yet read)
     */
    public function unread(): JsonResponse
    {
        $count = ChatMessage::where('user_id', Auth::id())
            ->where('sender', 'admin')
            ->where('is_read', false)
            ->count();

        return response()->json(['success' => true, 'unread' => $count]);
    }

    // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────

    /**
     * Admin: list all conversations (one row per author)
     */
    public function adminConversations(): JsonResponse
    {
        $conversations = ChatMessage::with('user')
            ->selectRaw('user_id, MAX(id) as last_message_id, COUNT(*) as total')
            ->groupBy('user_id')
            ->orderByDesc('last_message_id')
            ->get()
            ->map(function ($row) {
                $last = ChatMessage::find($row->last_message_id);
                $unread = ChatMessage::where('user_id', $row->user_id)
                    ->where('sender', 'author')
                    ->where('is_read', false)
                    ->count();

                return [
                    'user_id' => $row->user_id,
                    'user_name' => $row->user->name ?? 'Unknown',
                    'user_email' => $row->user->email ?? '',
                    'last_message' => $last?->message,
                    'last_at' => $last?->created_at->toISOString(),
                    'unread' => $unread,
                ];
            });

        return response()->json(['success' => true, 'data' => $conversations]);
    }

    /**
     * Admin: get full conversation with a specific author
     */
    public function adminMessages(int $userId): JsonResponse
    {
        // Mark author messages as read
        ChatMessage::where('user_id', $userId)
            ->where('sender', 'author')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = ChatMessage::where('user_id', $userId)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'sender' => $m->sender,
                'message' => $m->message,
                'is_read' => $m->is_read,
                'created_at' => $m->created_at->toISOString(),
            ]);

        $user = User::find($userId);

        return response()->json([
            'success' => true,
            'author' => ['id' => $user?->id, 'name' => $user?->name, 'email' => $user?->email],
            'data' => $messages,
        ]);
    }

    /**
     * Admin: reply to an author's conversation
     */
    public function adminReply(Request $request, int $userId): JsonResponse
    {
        $request->validate(['message' => 'required|string|max:2000']);

        $user = User::findOrFail($userId);

        $msg = ChatMessage::create([
            'user_id' => $user->id,
            'sender' => 'admin',
            'message' => $request->message,
            'is_read' => false,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $msg->id,
                'sender' => $msg->sender,
                'message' => $msg->message,
                'is_read' => $msg->is_read,
                'created_at' => $msg->created_at->toISOString(),
            ],
        ], 201);
    }
}
