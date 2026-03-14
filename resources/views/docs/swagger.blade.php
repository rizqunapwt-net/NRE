<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }} Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css">
    <style>
        body {
            margin: 0;
            background: #f5f7fb;
            font-family: Georgia, "Times New Roman", serif;
            color: #0f172a;
        }
        .docs-header {
            padding: 18px 24px;
            background: linear-gradient(135deg, #0f172a, #1d4ed8);
            color: #fff;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
            justify-content: space-between;
        }
        .docs-header h1 {
            margin: 0;
            font-size: 1.5rem;
        }
        .docs-links {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        .docs-links a {
            color: #fff;
            text-decoration: none;
            padding: 8px 12px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 999px;
        }
        #swagger-ui {
            max-width: 1380px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <header class="docs-header">
        <div>
            <h1>{{ config('app.name') }} API Docs</h1>
            <div>Swagger UI powered by generated OpenAPI JSON.</div>
        </div>
        <nav class="docs-links">
            <a href="{{ $redocUrl }}">Open ReDoc</a>
            <a href="{{ $pdfUrl }}">Open PDF</a>
            <a href="{{ $specUrl }}">Raw OpenAPI JSON</a>
        </nav>
    </header>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script>
        window.onload = function () {
            window.ui = SwaggerUIBundle({
                url: @json($specUrl),
                dom_id: '#swagger-ui',
                deepLinking: true,
                displayRequestDuration: true,
                persistAuthorization: true,
                tryItOutEnabled: true,
            });
        };
    </script>
</body>
</html>
