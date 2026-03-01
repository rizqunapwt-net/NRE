import React, { useState, useMemo } from 'react';
import {
    Card, Typography, Row, Col, InputNumber, Select, Form, Divider, Statistic,
    Tag, Button, Modal, Table, Input, Space, message, Tabs, Switch, Tooltip, Alert, Badge,
} from 'antd';
import {
    CalculatorOutlined, SettingOutlined, PlusOutlined, DeleteOutlined,
    SwapOutlined, ScissorOutlined, CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// ══════════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════════
interface PriceItem { name: string; price: number }
interface SizeItem { name: string; label: string; factor: number }
interface PrintType { name: string; label: string; costPerPage: number }

// ══════════════════════════════════════════════════════════════════
//  DEFAULT DATA
// ══════════════════════════════════════════════════════════════════
const DEFAULT_PAPERS: PriceItem[] = [
    { name: 'HVS 70gsm', price: 450 },
    { name: 'HVS 80gsm', price: 550 },
    { name: 'Art Paper 100gsm', price: 750 },
    { name: 'Art Paper 120gsm', price: 900 },
    { name: 'Art Paper 150gsm', price: 1100 },
    { name: 'Art Carton 210gsm', price: 1500 },
    { name: 'Art Carton 260gsm', price: 1800 },
    { name: 'Ivory 230gsm', price: 1600 },
    { name: 'Ivory 310gsm', price: 2000 },
];

const DEFAULT_BINDINGS: PriceItem[] = [
    { name: 'Jilid Kawat (Staple)', price: 2000 },
    { name: 'Perfect Binding (Lem)', price: 5000 },
    { name: 'Hard Cover', price: 25000 },
    { name: 'Spiral/Ring', price: 8000 },
    { name: 'Jahit Benang', price: 15000 },
];

const DEFAULT_COVERS: PriceItem[] = [
    { name: 'Tanpa Cover Khusus', price: 0 },
    { name: 'Laminasi Glossy', price: 3000 },
    { name: 'Laminasi Doff', price: 3500 },
    { name: 'Spot UV', price: 8000 },
    { name: 'Emboss', price: 12000 },
];

const DEFAULT_SIZES: SizeItem[] = [
    { name: 'A5', label: 'A5 (14.8 x 21 cm)', factor: 1.0 },
    { name: 'B5', label: 'B5 (17.6 x 25 cm)', factor: 1.2 },
    { name: 'A4', label: 'A4 (21 x 29.7 cm)', factor: 1.6 },
    { name: '14x21', label: '14 x 21 cm', factor: 0.95 },
    { name: '15x23', label: '15 x 23 cm', factor: 1.1 },
    { name: 'Custom', label: 'Custom', factor: 1.5 },
];

const DEFAULT_PRINTS: PrintType[] = [
    { name: 'bw', label: 'Hitam Putih', costPerPage: 150 },
    { name: 'color', label: 'Full Color', costPerPage: 500 },
    { name: 'mixed', label: 'Campuran (BW + Color)', costPerPage: 300 },
];

// Plano defaults
const PLANO_SIZES = [
    { label: '61 × 86 cm', w: 61, h: 86 },
    { label: '65 × 100 cm', w: 65, h: 100 },
    { label: '79 × 109 cm', w: 79, h: 109 },
    { label: '77 × 110 cm', w: 77, h: 110 },
];

const BOOK_PRESETS = [
    { label: 'A5 (14.8 × 21 cm)', w: 14.8, h: 21 },
    { label: 'B5 (17.6 × 25 cm)', w: 17.6, h: 25 },
    { label: 'A4 (21 × 29.7 cm)', w: 21, h: 29.7 },
    { label: '14 × 21 cm', w: 14, h: 21 },
    { label: '15 × 23 cm', w: 15, h: 23 },
    { label: '16 × 24 cm', w: 16, h: 24 },
    { label: 'A3 (29.7 × 42 cm)', w: 29.7, h: 42 },
];

// ══════════════════════════════════════════════════════════════════
//  STORAGE
// ══════════════════════════════════════════════════════════════════
const STORAGE_KEY = 'nre_calc_settings';
function loadSettings() {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch { /* */ }
    return null;
}
function saveSettings(data: any) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

// ══════════════════════════════════════════════════════════════════
//  SETTINGS MODAL (unchanged from original)
// ══════════════════════════════════════════════════════════════════
function SettingsModal({ open, onClose, data, onSave }: {
    open: boolean; onClose: () => void;
    data: { papers: PriceItem[]; bindings: PriceItem[]; covers: PriceItem[]; sizes: SizeItem[]; prints: PrintType[] };
    onSave: (d: typeof data) => void;
}) {
    const [papers, setPapers] = useState([...data.papers]);
    const [bindings, setBindings] = useState([...data.bindings]);
    const [covers, setCovers] = useState([...data.covers]);
    const [sizes, setSizes] = useState([...data.sizes]);
    const [prints, setPrints] = useState([...data.prints]);
    const [tab, setTab] = useState<string>('papers');

    const handleSave = () => { onSave({ papers, bindings, covers, sizes, prints }); message.success('Pengaturan disimpan'); onClose(); };

    const addRow = () => {
        if (tab === 'papers') setPapers([...papers, { name: 'Baru', price: 0 }]);
        else if (tab === 'bindings') setBindings([...bindings, { name: 'Baru', price: 0 }]);
        else if (tab === 'covers') setCovers([...covers, { name: 'Baru', price: 0 }]);
        else if (tab === 'sizes') setSizes([...sizes, { name: 'Baru', label: 'Baru', factor: 1.0 }]);
        else if (tab === 'prints') setPrints([...prints, { name: 'baru', label: 'Baru', costPerPage: 0 }]);
    };

    const deleteRow = (idx: number) => {
        if (tab === 'papers') setPapers(papers.filter((_, i) => i !== idx));
        else if (tab === 'bindings') setBindings(bindings.filter((_, i) => i !== idx));
        else if (tab === 'covers') setCovers(covers.filter((_, i) => i !== idx));
        else if (tab === 'sizes') setSizes(sizes.filter((_, i) => i !== idx));
        else if (tab === 'prints') setPrints(prints.filter((_, i) => i !== idx));
    };

    const updateItem = (idx: number, field: string, value: any) => {
        if (tab === 'papers') { const c = [...papers]; (c[idx] as any)[field] = value; setPapers(c); }
        else if (tab === 'bindings') { const c = [...bindings]; (c[idx] as any)[field] = value; setBindings(c); }
        else if (tab === 'covers') { const c = [...covers]; (c[idx] as any)[field] = value; setCovers(c); }
        else if (tab === 'sizes') { const c = [...sizes]; (c[idx] as any)[field] = value; setSizes(c); }
        else if (tab === 'prints') { const c = [...prints]; (c[idx] as any)[field] = value; setPrints(c); }
    };

    const currentData = tab === 'papers' ? papers : tab === 'bindings' ? bindings : tab === 'covers' ? covers : tab === 'sizes' ? sizes : prints;
    const tabs = [
        { key: 'papers', label: 'Kertas' }, { key: 'bindings', label: 'Jilid' },
        { key: 'covers', label: 'Cover' }, { key: 'sizes', label: 'Ukuran' }, { key: 'prints', label: 'Jenis Cetak' },
    ];

    const priceColumns = [
        {
            title: 'Nama', dataIndex: 'name', key: 'name',
            render: (v: string, _: any, i: number) => <Input value={v} onChange={e => updateItem(i, 'name', e.target.value)} size="small" />
        },
        {
            title: tab === 'sizes' ? 'Faktor' : tab === 'prints' ? 'Harga/Halaman' : 'Harga (Rp)', key: 'price',
            render: (_: any, record: any, i: number) => {
                const field = tab === 'sizes' ? 'factor' : tab === 'prints' ? 'costPerPage' : 'price';
                return <InputNumber value={record[field]} onChange={v => updateItem(i, field, v || 0)} size="small" style={{ width: 120 }}
                    formatter={v => tab === 'sizes' ? `x${v}` : `${v}`} />;
            }
        },
        ...(tab === 'sizes' || tab === 'prints' ? [{
            title: 'Label', key: 'label',
            render: (_: any, record: any, i: number) => <Input value={record.label} onChange={e => updateItem(i, 'label', e.target.value)} size="small" />
        }] : []),
        {
            title: '', key: 'action', width: 40,
            render: (_: any, __: any, i: number) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => deleteRow(i)} />
        },
    ];

    return (
        <Modal open={open} onCancel={onClose} onOk={handleSave} title="Pengaturan Harga" width={700} okText="Simpan" cancelText="Batal">
            <Space style={{ marginBottom: 16 }}>
                {tabs.map(t => <Button key={t.key} type={tab === t.key ? 'primary' : 'default'} size="small" onClick={() => setTab(t.key)}>{t.label}</Button>)}
            </Space>
            <Table dataSource={currentData.map((item, i) => ({ ...item, _key: i }))} columns={priceColumns} rowKey="_key" pagination={false} size="small" />
            <Button type="dashed" icon={<PlusOutlined />} onClick={addRow} style={{ marginTop: 8 }} block>Tambah</Button>
        </Modal>
    );
}

// ══════════════════════════════════════════════════════════════════
//  PLANO LAYOUT SVG VISUALIZER
// ══════════════════════════════════════════════════════════════════
interface PlanoCalcResult {
    cols: number; rows: number; perSheet: number;
    usedW: number; usedH: number; wastePercent: number;
    effectiveW: number; effectiveH: number;
    layoutW: number; layoutH: number;
}
function calcPlanoLayout(
    planoW: number, planoH: number, bookW: number, bookH: number,
    bleed: number, gripper: number
): PlanoCalcResult {
    const layoutW = bookW + bleed * 2;
    const layoutH = bookH + bleed * 2;
    const effectiveW = planoW - gripper;
    const effectiveH = planoH;

    const cols = Math.floor(effectiveW / layoutW);
    const rows = Math.floor(effectiveH / layoutH);
    const perSheet = cols * rows;
    const usedW = cols * layoutW;
    const usedH = rows * layoutH;
    const planoArea = planoW * planoH;
    const usedArea = usedW * usedH;
    const wastePercent = planoArea > 0 ? ((planoArea - usedArea) / planoArea) * 100 : 100;

    return { cols, rows, perSheet, usedW, usedH, wastePercent, effectiveW, effectiveH, layoutW, layoutH };
}

function PlanoSVG({ planoW, planoH, result, gripper, label }: {
    planoW: number; planoH: number; result: PlanoCalcResult; gripper: number; label: string;
}) {
    const maxW = 480;
    const maxH = 360;
    const pad = 16;
    const scale = Math.min((maxW - pad * 2) / planoW, (maxH - pad * 2) / planoH);
    const svgW = planoW * scale + pad * 2;
    const svgH = planoH * scale + pad * 2 + 28;

    const pw = planoW * scale;
    const ph = planoH * scale;
    const gripperPx = gripper * scale;
    const lw = result.layoutW * scale;
    const lh = result.layoutH * scale;

    const blocks: React.ReactNode[] = [];
    for (let c = 0; c < result.cols; c++) {
        for (let r = 0; r < result.rows; r++) {
            const x = pad + gripperPx + c * lw;
            const y = pad + r * lh;
            blocks.push(
                <g key={`${c}-${r}`}>
                    <rect x={x + 0.5} y={y + 0.5} width={lw - 1} height={lh - 1}
                        fill="rgba(0, 139, 148, 0.15)" stroke="#008B94" strokeWidth={1} rx={2} />
                    {lw > 20 && lh > 14 && (
                        <text x={x + lw / 2} y={y + lh / 2 + 4} textAnchor="middle"
                            fontSize={Math.min(10, lw / 4)} fill="#008B94" fontWeight={600}>
                            {c * result.rows + r + 1}
                        </text>
                    )}
                </g>
            );
        }
    }

    return (
        <div style={{ textAlign: 'center' }}>
            <svg width={svgW} height={svgH} style={{ background: '#fafafa', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                {/* Plano paper */}
                <rect x={pad} y={pad} width={pw} height={ph}
                    fill="#f3f4f6" stroke="#d1d5db" strokeWidth={1.5} rx={4} />

                {/* Gripper zone */}
                {gripperPx > 0 && (
                    <rect x={pad} y={pad} width={gripperPx} height={ph}
                        fill="rgba(239, 68, 68, 0.12)" stroke="rgba(239, 68, 68, 0.4)" strokeWidth={0.5} rx={2} />
                )}
                {gripperPx > 8 && (
                    <text x={pad + gripperPx / 2} y={pad + ph / 2} textAnchor="middle"
                        fontSize={8} fill="#ef4444" transform={`rotate(-90, ${pad + gripperPx / 2}, ${pad + ph / 2})`}>
                        GRIPPER
                    </text>
                )}

                {/* Layout blocks */}
                {blocks}

                {/* Waste right */}
                {result.usedW < result.effectiveW && (
                    <rect x={pad + gripperPx + result.usedW * scale} y={pad}
                        width={(result.effectiveW - result.usedW) * scale} height={ph}
                        fill="rgba(245, 158, 11, 0.08)" stroke="rgba(245, 158, 11, 0.3)"
                        strokeWidth={0.5} strokeDasharray="4 2" />
                )}

                {/* Waste bottom */}
                {result.usedH < result.effectiveH && (
                    <rect x={pad + gripperPx} y={pad + result.usedH * scale}
                        width={result.usedW * scale} height={(result.effectiveH - result.usedH) * scale}
                        fill="rgba(245, 158, 11, 0.08)" stroke="rgba(245, 158, 11, 0.3)"
                        strokeWidth={0.5} strokeDasharray="4 2" />
                )}

                {/* Dimension labels */}
                <text x={pad + pw / 2} y={pad + ph + 16} textAnchor="middle" fontSize={10} fill="#6b7280">
                    {planoW} cm
                </text>
                <text x={pad - 4} y={pad + ph / 2} textAnchor="middle" fontSize={10} fill="#6b7280"
                    transform={`rotate(-90, ${pad - 4}, ${pad + ph / 2})`}>
                    {planoH} cm
                </text>
            </svg>
            <div style={{ marginTop: 4 }}>
                <Tag color={result.perSheet > 0 ? 'blue' : 'default'} style={{ fontSize: 13, padding: '2px 12px' }}>
                    {label}: {result.cols} × {result.rows} = <strong>{result.perSheet}</strong> lembar/plano
                </Tag>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
//  TAB 2: PLANO CALCULATOR
// ══════════════════════════════════════════════════════════════════
const PlanoCalculator: React.FC = () => {
    const [planoIdx, setPlanoIdx] = useState(0);
    const [customPlanoW, setCustomPlanoW] = useState(65);
    const [customPlanoH, setCustomPlanoH] = useState(100);
    const [bookPresetIdx, setBookPresetIdx] = useState<number | null>(0);
    const [bookW, setBookW] = useState(14.8);
    const [bookH, setBookH] = useState(21);
    const [bleed, setBleed] = useState(0.3);
    const [gripper, setGripper] = useState(1.5);
    const [target, setTarget] = useState(500);
    const [swapped, setSwapped] = useState(false);
    const [pricePerPlano, setPricePerPlano] = useState(0);

    const isCustomPlano = planoIdx >= PLANO_SIZES.length;
    const rawPlanoW = isCustomPlano ? customPlanoW : PLANO_SIZES[planoIdx].w;
    const rawPlanoH = isCustomPlano ? customPlanoH : PLANO_SIZES[planoIdx].h;
    const planoW = swapped ? rawPlanoH : rawPlanoW;
    const planoH = swapped ? rawPlanoW : rawPlanoH;

    const handleBookPreset = (idx: number | null) => {
        setBookPresetIdx(idx);
        if (idx !== null && idx < BOOK_PRESETS.length) {
            setBookW(BOOK_PRESETS[idx].w);
            setBookH(BOOK_PRESETS[idx].h);
        }
    };

    // Calculate both orientations
    const resultA = useMemo(() => calcPlanoLayout(planoW, planoH, bookW, bookH, bleed, gripper), [planoW, planoH, bookW, bookH, bleed, gripper]);
    const resultB = useMemo(() => calcPlanoLayout(planoH, planoW, bookW, bookH, bleed, gripper), [planoW, planoH, bookW, bookH, bleed, gripper]);

    const bestIsA = resultA.perSheet >= resultB.perSheet;
    const best = bestIsA ? resultA : resultB;
    const bestPlanoW = bestIsA ? planoW : planoH;
    const bestPlanoH = bestIsA ? planoH : planoW;

    const totalPlano = best.perSheet > 0 ? Math.ceil(target / best.perSheet) : 0;
    const totalProduced = totalPlano * best.perSheet;
    const totalPaperCost = pricePerPlano > 0 ? totalPlano * pricePerPlano : 0;

    return (
        <div>
            <Row gutter={[24, 24]}>
                {/* ── Left: Inputs ── */}
                <Col xs={24} lg={10}>
                    <Card title={<><ScissorOutlined /> Konfigurasi Potong</>}
                        style={{ border: '1px solid #e5e7eb' }}>
                        <Form layout="vertical" size="large">
                            {/* Plano Size */}
                            <Form.Item label="Ukuran Plano">
                                <Select value={planoIdx} onChange={v => setPlanoIdx(v)}>
                                    {PLANO_SIZES.map((s, i) => <Option key={i} value={i}>{s.label}</Option>)}
                                    <Option value={PLANO_SIZES.length}>Custom...</Option>
                                </Select>
                            </Form.Item>

                            {isCustomPlano && (
                                <Form.Item label="Ukuran Plano Custom (cm)">
                                    <Space>
                                        <InputNumber min={10} max={200} value={customPlanoW} onChange={v => setCustomPlanoW(v || 65)} addonAfter="cm" />
                                        <Text>×</Text>
                                        <InputNumber min={10} max={200} value={customPlanoH} onChange={v => setCustomPlanoH(v || 100)} addonAfter="cm" />
                                    </Space>
                                </Form.Item>
                            )}

                            <Form.Item>
                                <Space>
                                    <Switch checked={swapped} onChange={setSwapped} />
                                    <Text><SwapOutlined /> Tukar Samping/Bawah (Plano)</Text>
                                </Space>
                                <div style={{ marginTop: 4 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Saat ini: {planoW} × {planoH} cm
                                    </Text>
                                </div>
                            </Form.Item>

                            <Divider style={{ margin: '8px 0' }} />

                            {/* Book Size */}
                            <Form.Item label="Preset Ukuran Buku">
                                <Select value={bookPresetIdx} onChange={handleBookPreset} allowClear placeholder="Pilih preset atau isi manual">
                                    {BOOK_PRESETS.map((b, i) => <Option key={i} value={i}>{b.label}</Option>)}
                                </Select>
                            </Form.Item>

                            <Form.Item label="Ukuran Layout Kecil (cm)">
                                <Row gutter={8}>
                                    <Col span={11}>
                                        <InputNumber min={1} max={100} step={0.1} value={bookW}
                                            onChange={v => { setBookW(v || 14.8); setBookPresetIdx(null); }}
                                            style={{ width: '100%' }} addonAfter="cm" placeholder="Lebar" />
                                    </Col>
                                    <Col span={2} style={{ textAlign: 'center', lineHeight: '40px' }}>
                                        <Text>×</Text>
                                    </Col>
                                    <Col span={11}>
                                        <InputNumber min={1} max={100} step={0.1} value={bookH}
                                            onChange={v => { setBookH(v || 21); setBookPresetIdx(null); }}
                                            style={{ width: '100%' }} addonAfter="cm" placeholder="Tinggi" />
                                    </Col>
                                </Row>
                            </Form.Item>

                            <Divider style={{ margin: '8px 0' }} />

                            {/* Advanced */}
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label={<Tooltip title="Tambahan area untuk pemotongan. Standar: 3mm (0.3 cm)">Bleed (cm)</Tooltip>}>
                                        <InputNumber min={0} max={2} step={0.1} value={bleed}
                                            onChange={v => setBleed(v ?? 0)} style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label={<Tooltip title="Area cengkeram mesin. Standar: 1.5 cm">Gripper (cm)</Tooltip>}>
                                        <InputNumber min={0} max={5} step={0.1} value={gripper}
                                            onChange={v => setGripper(v ?? 0)} style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item label="Target Cetak (Lembar)">
                                <InputNumber min={1} max={100000} value={target}
                                    onChange={v => setTarget(v || 500)} style={{ width: '100%' }}
                                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                    parser={v => Number(v?.replace(/\./g, '') || 500)} />
                            </Form.Item>

                            <Form.Item label="Harga per Lembar Plano (opsional)">
                                <InputNumber min={0} max={1000000} value={pricePerPlano}
                                    onChange={v => setPricePerPlano(v || 0)} style={{ width: '100%' }}
                                    formatter={v => `Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                    parser={v => Number(v?.replace(/[Rp\s.]/g, '') || 0)} />
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                {/* ── Right: Results ── */}
                <Col xs={24} lg={14}>
                    {/* Best orientation badge */}
                    {resultA.perSheet !== resultB.perSheet && (
                        <Alert type="success" showIcon icon={<CheckCircleOutlined />}
                            message={`Orientasi terbaik: ${bestIsA ? 'Normal' : 'Diputar'} (${bestPlanoW}×${bestPlanoH} cm) — ${best.perSheet} lembar/plano`}
                            style={{ marginBottom: 16 }} />
                    )}

                    {/* Stats */}
                    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                        <Col xs={12} sm={6}>
                            <Card size="small" style={{ textAlign: 'center', border: '1px solid #e5e7eb' }}>
                                <Statistic title="Per Plano" value={best.perSheet} suffix="lbr"
                                    valueStyle={{ color: '#008B94', fontSize: 28, fontWeight: 700 }} />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small" style={{ textAlign: 'center', border: '1px solid #e5e7eb' }}>
                                <Statistic title="Plano Dibutuhkan" value={totalPlano} suffix="plano"
                                    valueStyle={{ fontSize: 28, fontWeight: 700 }} />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small" style={{ textAlign: 'center', border: '1px solid #e5e7eb' }}>
                                <Statistic title="Total Dihasilkan" value={totalProduced} suffix="lbr"
                                    valueStyle={{ color: '#10b981', fontSize: 28, fontWeight: 700 }} />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small" style={{ textAlign: 'center', border: '1px solid #e5e7eb' }}>
                                <Statistic title="Waste" value={best.wastePercent.toFixed(1)} suffix="%"
                                    valueStyle={{ color: best.wastePercent > 30 ? '#ef4444' : '#f59e0b', fontSize: 28, fontWeight: 700 }} />
                            </Card>
                        </Col>
                    </Row>

                    {/* Paper cost */}
                    {totalPaperCost > 0 && (
                        <Card size="small" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', border: '1px solid #bfdbfe' }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Statistic title="Total Biaya Kertas" value={`Rp ${totalPaperCost.toLocaleString('id-ID')}`}
                                        valueStyle={{ color: '#1e40af', fontWeight: 700 }} />
                                </Col>
                                <Col span={12}>
                                    <Statistic title="Biaya Kertas per Lembar" value={`Rp ${best.perSheet > 0 ? Math.ceil(pricePerPlano / best.perSheet).toLocaleString('id-ID') : '0'}`}
                                        valueStyle={{ color: '#6b7280' }} />
                                </Col>
                            </Row>
                        </Card>
                    )}

                    {/* Visual comparison */}
                    <Card title="Perbandingan Orientasi" size="small" style={{ border: '1px solid #e5e7eb' }}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <Badge.Ribbon text={bestIsA ? '✓ Terbaik' : ''} color={bestIsA ? 'green' : 'default'}
                                    style={{ display: bestIsA && resultA.perSheet !== resultB.perSheet ? 'block' : 'none' }}>
                                    <div style={{ border: bestIsA ? '2px solid #10b981' : '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                                        <PlanoSVG planoW={planoW} planoH={planoH} result={resultA} gripper={gripper} label="Normal" />
                                    </div>
                                </Badge.Ribbon>
                            </Col>
                            <Col xs={24} md={12}>
                                <Badge.Ribbon text={!bestIsA ? '✓ Terbaik' : ''} color={!bestIsA ? 'green' : 'default'}
                                    style={{ display: !bestIsA && resultA.perSheet !== resultB.perSheet ? 'block' : 'none' }}>
                                    <div style={{ border: !bestIsA ? '2px solid #10b981' : '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                                        <PlanoSVG planoW={planoH} planoH={planoW} result={resultB} gripper={gripper} label="Diputar" />
                                    </div>
                                </Badge.Ribbon>
                            </Col>
                        </Row>
                    </Card>

                    {/* Detail table */}
                    <Card title="Detail Kalkulasi" size="small" style={{ marginTop: 16, border: '1px solid #e5e7eb' }}>
                        <table style={{ width: '100%', fontSize: 13 }}>
                            <tbody>
                                {[
                                    ['Ukuran Plano', `${planoW} × ${planoH} cm`],
                                    ['Ukuran Layout (+bleed)', `${(bookW + bleed * 2).toFixed(1)} × ${(bookH + bleed * 2).toFixed(1)} cm`],
                                    ['Area Efektif (- gripper)', `${(planoW - gripper).toFixed(1)} × ${planoH} cm`],
                                    ['Susunan (kolom × baris)', `${best.cols} × ${best.rows}`],
                                    ['Hasil per Plano', `${best.perSheet} lembar`],
                                    ['Target Cetak', `${target.toLocaleString('id-ID')} lembar`],
                                    ['Plano Dibutuhkan', `${totalPlano.toLocaleString('id-ID')} plano`],
                                    ['Total Dihasilkan', `${totalProduced.toLocaleString('id-ID')} lembar`],
                                    ['Sisa/Kelebihan', `${(totalProduced - target).toLocaleString('id-ID')} lembar`],
                                ].map(([label, value], i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '6px 0', color: '#6b7280' }}>{label}</td>
                                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════
//  TAB 1: PRICE CALCULATOR (original, unchanged)
// ══════════════════════════════════════════════════════════════════
const PriceCalculator: React.FC<{
    papers: PriceItem[]; bindings: PriceItem[]; covers: PriceItem[];
    sizes: SizeItem[]; prints: PrintType[];
    onOpenSettings: () => void;
}> = ({ papers, bindings, covers, sizes, prints, onOpenSettings }) => {
    const [pages, setPages] = useState(100);
    const [copies, setCopies] = useState(100);
    const [paperIdx, setPaperIdx] = useState(0);
    const [bindingIdx, setBindingIdx] = useState(1);
    const [coverIdx, setCoverIdx] = useState(1);
    const [sizeIdx, setSizeIdx] = useState(0);
    const [printIdx, setPrintIdx] = useState(0);
    const [margin, setMargin] = useState(30);

    const calc = useMemo(() => {
        const paper = papers[paperIdx] || papers[0] || { price: 0 };
        const size = sizes[sizeIdx] || sizes[0] || { factor: 1 };
        const print = prints[printIdx] || prints[0] || { costPerPage: 0 };
        const bind = bindings[bindingIdx] || bindings[0] || { price: 0 };
        const cover = covers[coverIdx] || covers[0] || { price: 0 };
        const paperCost = paper.price * pages * size.factor;
        const printCost = print.costPerPage * pages;
        const bindCost = bind.price;
        const coverCost = cover.price;
        const costPerCopy = paperCost + printCost + bindCost + coverCost;
        const totalCost = costPerCopy * copies;
        const sellingPrice = costPerCopy * (1 + margin / 100);
        const totalRevenue = sellingPrice * copies;
        const totalProfit = totalRevenue - totalCost;
        return { paperCost, printCost, bindCost, coverCost, costPerCopy, totalCost, sellingPrice, totalRevenue, totalProfit };
    }, [pages, copies, paperIdx, bindingIdx, coverIdx, sizeIdx, printIdx, margin, papers, bindings, covers, sizes, prints]);

    const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

    return (
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
                <Card title="Parameter Cetak" extra={<Button icon={<SettingOutlined />} onClick={onOpenSettings} size="small">Atur Harga</Button>}>
                    <Form layout="vertical">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Jumlah Halaman">
                                    <InputNumber min={1} max={2000} value={pages} onChange={v => setPages(v || 100)} style={{ width: '100%' }} size="large" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Jumlah Eksemplar">
                                    <InputNumber min={1} max={100000} value={copies} onChange={v => setCopies(v || 100)} style={{ width: '100%' }} size="large" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item label="Ukuran">
                            <Select value={sizeIdx} onChange={setSizeIdx} size="large">
                                {sizes.map((s, i) => <Option key={i} value={i}>{s.label} (x{s.factor})</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item label="Jenis Cetak">
                            <Select value={printIdx} onChange={setPrintIdx} size="large">
                                {prints.map((p, i) => <Option key={i} value={i}>{p.label} — {fmt(p.costPerPage)}/hal</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item label="Jenis Kertas">
                            <Select value={paperIdx} onChange={setPaperIdx} size="large">
                                {papers.map((p, i) => <Option key={i} value={i}>{p.name} — {fmt(p.price)}/lbr</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item label="Jilid">
                            <Select value={bindingIdx} onChange={setBindingIdx} size="large">
                                {bindings.map((b, i) => <Option key={i} value={i}>{b.name} — {fmt(b.price)}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item label="Finishing Cover">
                            <Select value={coverIdx} onChange={setCoverIdx} size="large">
                                {covers.map((c, i) => <Option key={i} value={i}>{c.name}{c.price > 0 ? ` — ${fmt(c.price)}` : ''}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item label={`Margin Keuntungan: ${margin}%`}>
                            <InputNumber min={0} max={200} value={margin} onChange={v => setMargin(v || 30)} style={{ width: '100%' }} size="large"
                                formatter={v => `${v}%`} parser={v => Number(v?.replace('%', '') || 30)} />
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
            <Col xs={24} lg={12}>
                <Card title="Hasil Kalkulasi" style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">Biaya per Eksemplar</Text>
                        <Title level={2} style={{ margin: 0 }}>{fmt(calc.costPerCopy)}</Title>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                        <Text type="secondary">Harga Jual per Eksemplar (margin {margin}%)</Text>
                        <Title level={2} style={{ margin: 0, color: '#008B94' }}>{fmt(calc.sellingPrice)}</Title>
                    </div>
                </Card>
                <Card title={`Total untuk ${copies.toLocaleString('id-ID')} eksemplar`}>
                    <Row gutter={[16, 16]}>
                        <Col span={12}><Statistic title="Total Biaya Produksi" value={fmt(calc.totalCost)} /></Col>
                        <Col span={12}><Statistic title="Total Pendapatan" value={fmt(calc.totalRevenue)} valueStyle={{ color: '#008B94' }} /></Col>
                        <Col span={24}>
                            <Divider style={{ margin: '8px 0' }} />
                            <Statistic title="Estimasi Keuntungan" value={fmt(calc.totalProfit)}
                                valueStyle={{ color: calc.totalProfit >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 28 }} />
                        </Col>
                    </Row>
                </Card>
                <Card title="Rincian Biaya per Eksemplar" style={{ marginTop: 16 }}>
                    {[
                        [`Kertas (${papers[paperIdx]?.name}, ${pages} hal)`, calc.paperCost],
                        [`Cetak (${prints[printIdx]?.label}, ${pages} hal)`, calc.printCost],
                        [`Jilid (${bindings[bindingIdx]?.name})`, calc.bindCost],
                        [`Cover (${covers[coverIdx]?.name})`, calc.coverCost],
                    ].map(([label, value], i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text>{label as string}</Text>
                            <Tag>{fmt(value as number)}</Tag>
                        </div>
                    ))}
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>Total</Text>
                        <Tag color="blue">{fmt(calc.costPerCopy)}</Tag>
                    </div>
                </Card>
            </Col>
        </Row>
    );
};

// ══════════════════════════════════════════════════════════════════
//  MAIN PAGE WITH TABS
// ══════════════════════════════════════════════════════════════════
const CalculatorPage: React.FC = () => {
    const saved = loadSettings();
    const [papers, setPapers] = useState<PriceItem[]>(saved?.papers || DEFAULT_PAPERS);
    const [bindings, setBindings] = useState<PriceItem[]>(saved?.bindings || DEFAULT_BINDINGS);
    const [covers, setCovers] = useState<PriceItem[]>(saved?.covers || DEFAULT_COVERS);
    const [sizes, setSizes] = useState<SizeItem[]>(saved?.sizes || DEFAULT_SIZES);
    const [prints, setPrints] = useState<PrintType[]>(saved?.prints || DEFAULT_PRINTS);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleSaveSettings = (data: { papers: PriceItem[]; bindings: PriceItem[]; covers: PriceItem[]; sizes: SizeItem[]; prints: PrintType[] }) => {
        setPapers(data.papers); setBindings(data.bindings); setCovers(data.covers);
        setSizes(data.sizes); setPrints(data.prints); saveSettings(data);
    };

    const tabItems = [
        {
            key: 'price',
            label: <span><CalculatorOutlined /> Kalkulator Harga</span>,
            children: (
                <PriceCalculator
                    papers={papers} bindings={bindings} covers={covers}
                    sizes={sizes} prints={prints}
                    onOpenSettings={() => setSettingsOpen(true)}
                />
            ),
        },
        {
            key: 'plano',
            label: <span><ScissorOutlined /> Kalkulator Plano</span>,
            children: <PlanoCalculator />,
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}><CalculatorOutlined /> Kalkulator Percetakan</Title>
                <Text type="secondary">Hitung harga cetak dan layout potong kertas plano</Text>
            </div>

            <Tabs items={tabItems} defaultActiveKey="plano" size="large"
                style={{ background: 'transparent' }}
                tabBarStyle={{ marginBottom: 24 }} />

            <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)}
                data={{ papers, bindings, covers, sizes, prints }} onSave={handleSaveSettings} />
        </div>
    );
};

export default CalculatorPage;
