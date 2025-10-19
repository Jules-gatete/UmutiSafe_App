import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Modal from '../../components/Modal';
import { disposalsAPI } from '../../services/api';

export default function AdminDisposalInfo(){
  const { id } = useParams();
  const [disposal, setDisposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=>{
    const fetch = async ()=>{
      try{
        const res = await disposalsAPI.getById(id);
        if(res && res.success) setDisposal(res.data);
      }catch(e){
        console.error('Error loading disposal', e);
        setError('Failed to load disposal');
      }finally{ setLoading(false); }
    }
    fetch();
  },[id])

  const changeStatus = async (newStatus)=>{
    try{
      await disposalsAPI.update(id, { status: newStatus });
      const res = await disposalsAPI.getById(id);
      if(res && res.success) setDisposal(res.data);
    }catch(e){ console.error(e); alert('Failed to update status'); }
  }

  const remove = async ()=>{
    if(!confirm('Delete this disposal?')) return;
    try{
      await disposalsAPI.delete(id);
      // navigate back
      window.location.href = '/admin/disposals';
    }catch(e){ console.error(e); alert('Failed to delete'); }
  }

  if(loading) return <div className="p-8 text-center">Loading...</div>;
  if(error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if(!disposal) return <div className="p-8 text-center">No disposal found</div>;

  // derive display-friendly fields with fallbacks for different backend shapes
  const genericName = disposal.genericName || disposal.generic_name || disposal.medicine_name || 'Unknown medicine';
  const brandName = disposal.brandName || disposal.brand_name || '';
  const riskLevel = disposal.riskLevel || disposal.risk_level || 'N/A';
  const submittedAt = disposal.createdAt || disposal.created_at || disposal.createdAt;

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Disposal #{disposal.id}</h1>
        <Link to="/admin/disposals" className="text-sm text-primary-blue">Back</Link>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Medicine</h3>
            <p>{genericName} {brandName && `(${brandName})`}</p>
          </div>
          <div>
            <h3 className="font-semibold">Risk Level</h3>
            <p>{riskLevel}</p>
          </div>
          <div>
            <h3 className="font-semibold">Status</h3>
            <p>{disposal.status}</p>
          </div>
          <div>
            <h3 className="font-semibold">Submitted</h3>
            <p>{new Date(submittedAt).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="font-semibold">Disposed By</h3>
            <p>{disposal.user?.name || disposal.disposedBy || 'N/A'}</p>
            <p className="text-sm text-gray-600">{disposal.user?.email || ''}</p>
          </div>
          <div>
            <h3 className="font-semibold">Pickup</h3>
            {disposal.pickupRequest ? (
              <>
                <p>CHW: {disposal.pickupRequest.chw?.name || 'Not assigned'}</p>
                <p>Status: {disposal.pickupRequest.status}</p>
                <p>Location: {disposal.pickupRequest.pickupLocation || 'N/A'}</p>
              </>
            ) : (
              <p>No pickup requested</p>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold mb-2">Classification & Guidance</h3>
        <p><strong>Predicted Category:</strong> {disposal.predictedCategory || disposal.predicted_category || 'N/A'}</p>
        <p><strong>Confidence:</strong> {disposal.confidence ? (disposal.confidence * 100).toFixed(1) + '%' : 'N/A'}</p>
        <div className="mt-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold mb-1">Disposal Guidance</h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">{disposal.disposalGuidance || disposal.disposal_guidance || 'No guidance available'}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={()=>changeStatus('completed')} className="btn-primary">Mark Completed</button>
        <button onClick={()=>changeStatus('pickup_requested')} className="btn-outline">Mark Pickup Requested</button>
        <button onClick={remove} className="btn-danger">Delete</button>
      </div>
    </div>
  )
}
