import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../components/Table';
import StatCard from '../../components/StatCard';
import { adminAPI } from '../../services/api';

export default function AdminDisposalsList(){
  const [disposals, setDisposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const fetch = async ()=>{
      try {
        const res = await adminAPI.getDisposals();
        if(res && res.success) setDisposals(res.data);
      } catch(e){
        console.error('Failed to load admin disposals', e);
      } finally{ setLoading(false); }
    }
    fetch();
  },[])

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'genericName', label: 'Medicine' },
    { key: 'dosageForm', label: 'Form' },
    { key: 'predictedCategory', label: 'Predicted Cat' },
    { key: 'riskLevel', label: 'Risk' },
    { key: 'status', label: 'Status' },
    { key: 'disposedBy', label: 'Disposed By' },
    { key: 'pickupBy', label: 'Picked Up By' },
    { key: 'createdAt', label: 'Submitted' },
  ];

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Disposals</h1>
        <Link to="/admin" className="text-sm text-primary-blue">Back</Link>
      </div>
      <div className="card">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <Table
            columns={columns}
            data={disposals}
            actions={(row)=> (
              <Link to={`/admin/disposals/${row.id}`} className="btn-outline text-sm">View</Link>
            )}
          />
        )}
      </div>
    </div>
  )
}
