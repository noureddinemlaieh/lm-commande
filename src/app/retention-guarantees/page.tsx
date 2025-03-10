'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Typography, Spin, message, Tooltip, Input, DatePicker, Row, Col, Statistic, Progress, Select, Space, Divider } from 'antd';
import { EyeOutlined, EditOutlined, SearchOutlined, FileExcelOutlined, FilterOutlined, ReloadOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function RetentionGuaranteesPage() {
  const [loading, setLoading] = useState(true);
  const [retentions, setRetentions] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('releaseDate');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('ascend');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    partial: 0,
    released: 0,
    totalAmount: 0,
    pendingAmount: 0,
    releasedAmount: 0,
    overdueCount: 0
  });
  const router = useRouter();

  useEffect(() => {
    fetchRetentions();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [retentions]);

  const fetchRetentions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/retention-guarantees');
      if (!response.ok) throw new Error('Erreur lors du chargement des retenues de garantie');
      const data = await response.json();
      console.log('Données des retenues récupérées:', data);
      if (data.length > 0) {
        console.log('Structure du premier élément:', JSON.stringify(data[0], null, 2));
        console.log('Contact du premier élément:', data[0].invoice?.contact);
      }
      setRetentions(data);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Impossible de charger les retenues de garantie');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const today = dayjs();
    let totalAmount = 0;
    let pendingAmount = 0;
    let releasedAmount = 0;
    let pendingCount = 0;
    let partialCount = 0;
    let releasedCount = 0;
    let overdueCount = 0;

    retentions.forEach(retention => {
      totalAmount += retention.amount;
      
      if (retention.status === 'PENDING') {
        pendingCount++;
        pendingAmount += retention.amount;
        
        // Vérifier si la date de libération est dépassée
        if (retention.releaseDate && dayjs(retention.releaseDate).isBefore(today)) {
          overdueCount++;
        }
      } else if (retention.status === 'PARTIAL') {
        partialCount++;
        
        // Calculer le montant libéré et le montant restant
        const releasedForThis = retention.releases.reduce((sum: number, release: any) => sum + release.amount, 0);
        releasedAmount += releasedForThis;
        pendingAmount += (retention.amount - releasedForThis);
      } else if (retention.status === 'RELEASED') {
        releasedCount++;
        releasedAmount += retention.amount;
      }
    });

    setStats({
      total: retentions.length,
      pending: pendingCount,
      partial: partialCount,
      released: releasedCount,
      totalAmount,
      pendingAmount,
      releasedAmount,
      overdueCount
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'PARTIAL':
        return 'blue';
      case 'RELEASED':
        return 'green';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'PARTIAL':
        return 'Partiellement libérée';
      case 'RELEASED':
        return 'Libérée';
      default:
        return status;
    }
  };

  const handleViewRetention = (id: string) => {
    router.push(`/retention-guarantees/${id}`);
  };

  const handleEditRetention = (id: string) => {
    router.push(`/retention-guarantees/${id}/edit`);
  };

  const handleExportToExcel = () => {
    try {
      // Préparer les données pour l'export
      const exportData = sortedRetentions.map(retention => {
        // Récupérer le nom du client avec fallback sur différentes propriétés
        const clientName = retention.invoice?.contact?.nom || 
                          retention.invoice?.contact?.name || 
                          retention.invoice?.contact?.company || 
                          'Non disponible';
        
        return {
          'Référence Facture': retention.invoice?.reference || 'N/A',
          'Client': clientName,
          'Montant Facture HT': retention.invoice?.totalHT?.toFixed(2) || '0.00',
          'Taux Retenue (%)': retention.rate,
          'Montant Retenue (€)': retention.amount.toFixed(2),
          'Date de Libération': retention.releaseDate ? dayjs(retention.releaseDate).format('DD/MM/YYYY') : 'Non définie',
          'Statut': getStatusText(retention.status),
          'Montant Libéré (€)': retention.releases?.reduce((sum: number, release: any) => sum + release.amount, 0).toFixed(2) || '0.00',
          'Montant Restant (€)': (retention.amount - (retention.releases?.reduce((sum: number, release: any) => sum + release.amount, 0) || 0)).toFixed(2),
          'En Retard': isOverdue(retention) ? 'Oui' : 'Non',
          'Date de Création': dayjs(retention.createdAt).format('DD/MM/YYYY'),
          'Notes': retention.notes || ''
        };
      });

      // Créer un classeur Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Retenues de Garantie');

      // Ajuster la largeur des colonnes
      const columnWidths = [
        { wch: 20 }, // Référence Facture
        { wch: 25 }, // Client
        { wch: 15 }, // Montant Facture HT
        { wch: 15 }, // Taux Retenue
        { wch: 15 }, // Montant Retenue
        { wch: 15 }, // Date de Libération
        { wch: 15 }, // Statut
        { wch: 15 }, // Montant Libéré
        { wch: 15 }, // Montant Restant
        { wch: 10 }, // En Retard
        { wch: 15 }, // Date de Création
        { wch: 30 }  // Notes
      ];
      worksheet['!cols'] = columnWidths;

      // Générer le nom du fichier avec la date actuelle
      const fileName = `retenues_garantie_${dayjs().format('YYYY-MM-DD')}.xlsx`;

      // Télécharger le fichier
      XLSX.writeFile(workbook, fileName);
      
      message.success('Export Excel réalisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      message.error('Erreur lors de l\'export Excel');
    }
  };

  const filteredRetentions = retentions.filter(retention => {
    // Filtrer par texte de recherche
    const searchMatch = 
      !searchText || 
      retention.invoice?.reference?.toLowerCase().includes(searchText.toLowerCase()) ||
      retention.invoice?.contact?.nom?.toLowerCase().includes(searchText.toLowerCase());
    
    // Filtrer par plage de dates
    const dateMatch = 
      !dateRange[0] || !dateRange[1] || 
      (retention.releaseDate && 
       dayjs(retention.releaseDate).isAfter(dateRange[0]) && 
       dayjs(retention.releaseDate).isBefore(dateRange[1]));
    
    // Filtrer par statut
    const statusMatch = !statusFilter || retention.status === statusFilter;
    
    return searchMatch && dateMatch && statusMatch;
  });

  // Trier les retenues
  const sortedRetentions = [...filteredRetentions].sort((a, b) => {
    if (sortField === 'releaseDate') {
      const dateA = a.releaseDate ? dayjs(a.releaseDate) : dayjs('9999-12-31');
      const dateB = b.releaseDate ? dayjs(b.releaseDate) : dayjs('9999-12-31');
      return sortOrder === 'ascend' 
        ? dateA.diff(dateB) 
        : dateB.diff(dateA);
    } else if (sortField === 'amount') {
      return sortOrder === 'ascend' 
        ? a.amount - b.amount 
        : b.amount - a.amount;
    } else if (sortField === 'invoice') {
      const refA = a.invoice?.reference || '';
      const refB = b.invoice?.reference || '';
      return sortOrder === 'ascend' 
        ? refA.localeCompare(refB) 
        : refB.localeCompare(refA);
    }
    return 0;
  });

  const isOverdue = (record: any) => {
    return record.status === 'PENDING' && 
           record.releaseDate && 
           dayjs(record.releaseDate).isBefore(dayjs());
  };

  const columns = [
    {
      title: 'Facture',
      dataIndex: ['invoice', 'reference'],
      key: 'invoice',
      sorter: true,
      sortOrder: sortField === 'invoice' ? sortOrder : null,
      render: (text: string, record: any) => (
        <a onClick={() => router.push(`/invoices/${record.invoice.id}`)}>{text}</a>
      )
    },
    {
      title: 'Client',
      dataIndex: ['invoice', 'contact', 'nom'],
      key: 'client',
      render: (_: any, record: any) => {
        console.log('Données du client pour la ligne:', record.invoice?.contact);
        return record.invoice?.contact?.nom || 
               record.invoice?.contact?.name || 
               record.invoice?.contact?.company || 
               'Non disponible';
      }
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      sorter: true,
      sortOrder: sortField === 'amount' ? sortOrder : null,
      render: (amount: number) => `${amount.toFixed(2)} €`
    },
    {
      title: 'Taux',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => `${rate} %`
    },
    {
      title: 'Date de libération',
      dataIndex: 'releaseDate',
      key: 'releaseDate',
      sorter: true,
      sortOrder: sortField === 'releaseDate' ? sortOrder : null,
      render: (date: string, record: any) => (
        <span>
          {date ? dayjs(date).format('DD/MM/YYYY') : 'Non définie'}
          {isOverdue(record) && (
            <Tooltip title="Date de libération dépassée">
              <WarningOutlined style={{ color: 'red', marginLeft: 8 }} />
            </Tooltip>
          )}
        </span>
      )
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Voir les détails">
            <Button 
              icon={<EyeOutlined />} 
              type="text" 
              onClick={() => handleViewRetention(record.id)}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button 
              icon={<EditOutlined />} 
              type="text" 
              onClick={() => handleEditRetention(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0 }}>Suivi des retenues de garantie</Title>
        <Button 
          type="primary" 
          icon={<FileExcelOutlined />} 
          onClick={handleExportToExcel}
        >
          Exporter
        </Button>
      </div>
      
      {/* Statistiques */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Montant total des retenues"
              value={stats.totalAmount}
              precision={2}
              suffix="€"
            />
            <Progress 
              percent={stats.totalAmount > 0 ? (stats.releasedAmount / stats.totalAmount) * 100 : 0} 
              status="active" 
              format={percent => `${(percent || 0).toFixed(0)}% libéré`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Retenues en attente"
              value={stats.pending}
              suffix={`/ ${stats.total}`}
              valueStyle={{ color: stats.pending > 0 ? '#faad14' : '#3f8600' }}
              prefix={<ClockCircleOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Montant: {stats.pendingAmount.toFixed(2)} €</Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Retenues libérées"
              value={stats.released}
              suffix={`/ ${stats.total}`}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Montant: {stats.releasedAmount.toFixed(2)} €</Text>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Retenues en retard"
              value={stats.overdueCount}
              valueStyle={{ color: stats.overdueCount > 0 ? '#cf1322' : '#3f8600' }}
              prefix={<WarningOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Button 
                type="link" 
                size="small" 
                disabled={stats.overdueCount === 0}
                onClick={() => {
                  setStatusFilter('PENDING');
                  setDateRange([null, dayjs()]);
                }}
              >
                Voir les retenues en retard
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
      
      {/* Filtres */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="Rechercher par facture ou client"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          
          <Col span={7}>
            <RangePicker
              placeholder={['Date début', 'Date fin']}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
              format="DD/MM/YYYY"
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          
          <Col span={4}>
            <Select
              placeholder="Statut"
              value={statusFilter || undefined}
              onChange={value => setStatusFilter(value)}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="PENDING">En attente</Option>
              <Option value="PARTIAL">Partiellement libérée</Option>
              <Option value="RELEASED">Libérée</Option>
            </Select>
          </Col>
          
          <Col span={7}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => fetchRetentions()}
                loading={loading}
              >
                Actualiser
              </Button>
              <Button 
                icon={<FilterOutlined />} 
                onClick={() => {
                  setSearchText('');
                  setDateRange([null, null]);
                  setStatusFilter(null);
                }}
              >
                Réinitialiser les filtres
              </Button>
            </Space>
          </Col>
        </Row>
        
        <Divider style={{ margin: '16px 0' }} />
        
        <Row>
          <Col span={24}>
            <Text>
              {filteredRetentions.length} retenue(s) trouvée(s) sur un total de {retentions.length}
            </Text>
          </Col>
        </Row>
      </Card>
      
      {/* Tableau des retenues */}
      <Card>
        <Table
          dataSource={sortedRetentions}
          columns={columns}
          rowKey="id"
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} retenues`
          }}
          locale={{ emptyText: 'Aucune retenue de garantie trouvée' }}
          loading={loading}
          onChange={handleTableChange}
          rowClassName={(record) => isOverdue(record) ? 'retention-overdue-row' : ''}
        />
      </Card>
      
      <style jsx global>{`
        .retention-overdue-row {
          background-color: #fff1f0;
        }
      `}</style>
    </div>
  );
} 