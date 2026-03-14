<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }} ReDoc</title>
    <style>
        body {
            margin: 0;
            background: #fffdf7;
            font-family: Georgia, "Times New Roman", serif;
            color: #1f2937;
        }
        .docs-header {
            padding: 18px 24px;
            background: linear-gradient(135deg, #7c2d12, #ea580c);
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
    </style>
</head>
<body>
    <header class="docs-header">
        <div>
            <h1>{{ config('app.name') }} API Docs</h1>
            <div>ReDoc view for the generated OpenAPI reference.</div>
        </div>
        <nav class="docs-links">
            <a href="{{ $swaggerUrl }}">Open Swagger UI</a>
            <a href="{{ $pdfUrl }}">Open PDF</a>
            <a href="{{ $specUrl }}">Raw OpenAPI JSON</a>
        </nav>
    </header>
    <redoc spec-url="{{ $specUrl }}"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>
