import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Spin, Empty, Button } from 'antd';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import BookCoverPlaceholder from '../../landing/components/BookCoverPlaceholder';

const { Title, Text, Paragraph } = Typography;

interface CollectionBook {
    id: number;
    title: string;
    slug: string;
    cover_path: string | null;
    author: { name: string } | null;
    purchased_at: string;
}

const MyCollectionPage: React.FC = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState<CollectionBook[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                const res = await api.get('/user/library');
                if (res.data?.success) {
                    setBooks(res.data.data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch library:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLibrary();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Memuat koleksi e-book..." />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ fontFamily: "'DM Serif Display', serif" }}>E-Book Koleksi Saya</Title>
                <Paragraph type="secondary">Daftar e-book yang telah Anda beli dan dapat dibaca kapan saja.</Paragraph>
            </div>

            {books.length > 0 ? (
                <Row gutter={[24, 24]}>
                    {books.map(book => (
                        <Col xs={24} sm={12} md={8} lg={6} key={book.id}>
                            <Card
                                hoverable
                                cover={
                                    <div style={{ height: 280, padding: '20px 20px 0' }}>
                                        <BookCoverPlaceholder 
                                            title={book.title} 
                                            imageUrl={book.cover_path ? `/api/v1/public/books/${book.id}/cover-image` : null}
                                            size="small"
                                        />
                                    </div>
                                }
                                bodyStyle={{ padding: '20px' }}
                                style={{ borderRadius: 16, overflow: 'hidden' }}
                            >
                                <div style={{ marginBottom: 12 }}>
                                    <Title level={5} style={{ margin: 0, fontSize: 16 }} ellipsis={{ rows: 2 }}>
                                        {book.title}
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        {book.author?.name || 'Unknown Author'}
                                    </Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                                    <Button 
                                        type="primary" 
                                        icon={<Eye size={16} />}
                                        onClick={() => navigate(`/katalog/${book.slug}/baca`)}
                                        block
                                    >
                                        Baca Sekarang
                                    </Button>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Card bordered={false} style={{ borderRadius: 16, textAlign: 'center', padding: '80px 0' }}>
                    <Empty 
                        description="Belum ada e-book dalam koleksi Anda."
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button type="primary" onClick={() => navigate('/katalog')}>Jelajahi Katalog</Button>
                    </Empty>
                </Card>
            )}
        </div>
    );
};

export default MyCollectionPage;
