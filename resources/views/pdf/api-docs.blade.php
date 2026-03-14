<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ data_get($spec, 'info.title', config('app.name').' API Reference') }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #111827;
            line-height: 1.45;
        }
        h1, h2, h3 {
            margin-bottom: 8px;
        }
        .meta {
            margin-bottom: 18px;
            color: #4b5563;
        }
        .method {
            display: inline-block;
            min-width: 58px;
            padding: 4px 8px;
            font-weight: bold;
            background: #e5e7eb;
            border-radius: 999px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        th, td {
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            vertical-align: top;
            text-align: left;
        }
        .small {
            color: #6b7280;
        }
    </style>
</head>
<body>
    <h1>{{ data_get($spec, 'info.title', config('app.name').' API Reference') }}</h1>
    <div class="meta">
        <div>{{ data_get($spec, 'info.description', 'Generated API reference.') }}</div>
        <div>Version: {{ data_get($spec, 'info.version', '1.0.0') }}</div>
        <div>Base URL: {{ $baseUrl }}</div>
        <div>Generated at: {{ $generatedAt->format('Y-m-d H:i:s') }}</div>
    </div>

    <div class="small">This PDF is a compact export. Use Swagger UI or ReDoc for the full interactive reference and detailed examples.</div>
    <table>
        <thead>
            <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Summary</th>
                <th>Auth</th>
                <th>Rate limit</th>
                <th>Params</th>
                <th>Body</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach(data_get($spec, 'operations', []) as $operation)
                <tr>
                    <td>{{ $operation['method'] }}</td>
                    <td>{{ $operation['path'] }}</td>
                    <td>{{ $operation['summary'] }}</td>
                    <td>{{ $operation['auth'] }}</td>
                    <td>{{ $operation['rate_limit'] }}</td>
                    <td>{{ $operation['parameter_count'] }}</td>
                    <td>{{ $operation['request_body_types'] !== '' ? $operation['request_body_types'] : '-' }}</td>
                    <td>{{ $operation['status_codes'] !== '' ? $operation['status_codes'] : '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
