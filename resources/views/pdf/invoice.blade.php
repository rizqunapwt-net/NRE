<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Invoice Royalti {{ $invoiceNumber }}</title>
    <style>
        @page { margin: 0; }
        body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            font-size: 11pt; 
            color: #1f2937; 
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }
        .container { padding: 40pt; }
        .header { 
            background: #1DBC8A; 
            color: white; 
            padding: 40pt; 
            margin-bottom: 30pt;
            position: relative;
        }
        .header-content { display: block; width: 100%; }
        .header-left { float: left; width: 60%; }
        .header-right { float: right; width: 40%; text-align: right; }
        .clearfix::after { content: ""; clear: both; display: table; }
        
        .company-name { font-size: 24pt; font-weight: bold; margin-bottom: 5pt; letter-spacing: -1pt; }
        .invoice-label { font-size: 14pt; text-transform: uppercase; letter-spacing: 2pt; opacity: 0.9; }
        
        .section { margin-bottom: 30pt; }
        .section-title { 
            font-size: 10pt; 
            color: #6b7280; 
            text-transform: uppercase; 
            letter-spacing: 1pt; 
            margin-bottom: 10pt;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5pt;
        }
        
        .billing-grid { width: 100%; margin-bottom: 30pt; }
        .billing-col { width: 50%; vertical-align: top; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
        th { 
            background: #f9fafb; 
            padding: 12pt 10pt; 
            text-align: left; 
            font-size: 9pt; 
            text-transform: uppercase; 
            color: #4b5563;
            border-bottom: 2px solid #e5e7eb;
        }
        td { padding: 12pt 10pt; border-bottom: 1px solid #f3f4f6; }
        
        .amount { font-weight: bold; color: #111827; }
        .text-right { text-align: right; }
        
        .totals { margin-top: 20pt; float: right; width: 300pt; }
        .total-row { padding: 10pt; border-bottom: 1px solid #e5e7eb; }
        .total-row.grand-total { 
            background: #f0fdf4; 
            border-bottom: none; 
            font-size: 14pt; 
            color: #166534;
            margin-top: 10pt;
            padding: 15pt 10pt;
            border-radius: 4pt;
        }
        
        .footer { 
            position: fixed; 
            bottom: 40pt; 
            left: 40pt; 
            right: 40pt; 
            font-size: 9pt; 
            color: #9ca3af; 
            border-top: 1px solid #f3f4f6; 
            padding-top: 10pt;
        }
        .stamp {
            position: absolute;
            bottom: 100pt;
            right: 40pt;
            opacity: 0.5;
            transform: rotate(-15deg);
            border: 4pt solid #ef4444;
            color: #ef4444;
            padding: 10pt;
            font-weight: bold;
            font-size: 20pt;
            border-radius: 8pt;
        }
    </style>
</head>
<body>
    <div class="header clearfix">
        <div class="header-left">
            <div class="company-name">RIZQUNA</div>
            <div>Penerbit Dengan Pelayanan Prima</div>
        </div>
        <div class="header-right">
            <div class="invoice-label">Invoice Royalti</div>
            <div style="font-size: 12pt; margin-top: 10pt;">#{{ $invoiceNumber }}</div>
        </div>
    </div>

    <div class="container">
        <div class="billing-grid clearfix">
            <div class="billing-col" style="float: left;">
                <div class="section-title">Dibayar Kepada</div>
                <div style="font-weight: bold; font-size: 14pt;">{{ $calculation->author->name }}</div>
                <div>{{ $calculation->author->email }}</div>
                <div>{{ $calculation->author->phone }}</div>
            </div>
            <div class="billing-col" style="float: right; text-align: right;">
                <div class="section-title">Detail Invoice</div>
                <div><strong>Tanggal:</strong> {{ $generatedAt->format('d M Y') }}</div>
                <div><strong>Periode Penjualan:</strong> {{ $calculation->period_month }}</div>
                <div><strong>Status:</strong> FINALIZED</div>
            </div>
        </div>

        <div class="section" style="clear: both; padding-top: 20pt;">
            <div class="section-title">Item Penjualan</div>
            <table>
                <thead>
                    <tr>
                        <th>Deskripsi Buku</th>
                        <th class="text-right">Kuantitas</th>
                        <th class="text-right">Harga Bersih</th>
                        <th class="text-right">Royalti</th>
                        <th class="text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($calculation->items as $item)
                        <tr>
                            <td>
                                <div style="font-weight: bold;">{{ $item->book->title }}</div>
                                <div style="font-size: 9pt; color: #6b7280;">ISBN: {{ $item->book->isbn ?? '-' }}</div>
                            </td>
                            <td class="text-right">{{ $item->quantity }}</td>
                            <td class="text-right">Rp {{ number_format($item->net_price, 0, ',', '.') }}</td>
                            <td class="text-right">{{ number_format($item->royalty_percentage, 1) }}%</td>
                            <td class="text-right amount">Rp {{ number_format($item->amount, 0, ',', '.') }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="clearfix">
            <div class="totals">
                <div class="total-row clearfix">
                    <span style="float: left;">Total Sebelum Pajak</span>
                    <span style="float: right;">Rp {{ number_format($calculation->total_amount, 0, ',', '.') }}</span>
                </div>
                <div class="total-row clearfix">
                    <span style="float: left;">Pajak (0%)</span>
                    <span style="float: right;">Rp 0</span>
                </div>
                <div class="total-row grand-total clearfix">
                    <span style="float: left; font-weight: bold;">TOTAL DITERIMA</span>
                    <span style="float: right; font-weight: bold;">Rp {{ number_format($calculation->total_amount, 0, ',', '.') }}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <div>Dokumen ini dihasilkan secara otomatis oleh Sistem ERP Rizquna. Segala bentuk persetujuan telah dilakukan secara digital.</div>
            <div style="margin-top: 5pt;">&copy; {{ date('Y') }} CV. New Rizquna Elfath. All rights reserved.</div>
        </div>
    </div>
</body>
</html>
