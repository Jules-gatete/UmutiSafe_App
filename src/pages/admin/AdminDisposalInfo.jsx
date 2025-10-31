import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Modal from '../../components/Modal';
import api, { disposalsAPI, adminAPI } from '../../services/api';
// api is the axios instance; disposalsAPI is the user-facing disposals client

export default function AdminDisposalInfo(){
  const { id } = useParams();
  const [disposal, setDisposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  useEffect(()=>{
    const fetch = async ()=>{
      try{
        // Try user-facing endpoint first (owner can fetch their disposal)
        let res;
        try {
          res = await disposalsAPI.getById(id);
          const payload = res.data ?? res;
          setDisposal(payload);
          return;
        } catch (e) {
          // If not found (likely because we're an admin and disposals are scoped to owner),
          // fetch via admin-by-id endpoint
          if (e?.response?.status === 404) {
            try {
              const adminResp = await adminAPI.getDisposalById(id);
              const payload = adminResp && adminResp.data ? adminResp.data : (adminResp?.data ?? adminResp);
              setDisposal(payload);
              return;
            } catch (adminErr) {
              console.error('Admin disposal fetch failed', adminErr);
              throw adminErr;
            }
          }
          throw e;
        }
      }catch(e){
        console.error('Error loading disposal', e);
        const status = e?.response?.status;
        if (status === 404) setError('Disposal not found (404)');
        else setError('Failed to load disposal');
      }finally{ setLoading(false); }
    }
    fetch();
  },[id])

  const changeStatus = async (newStatus)=>{
    try{
      // Try user endpoint, fall back to admin endpoint if necessary
      try {
        await disposalsAPI.update(id, { status: newStatus });
      } catch (e) {
        // try admin update
        await api.put(`/admin/disposals/${id}`, { status: newStatus });
      }
      // Refresh
      try {
        const res = await disposalsAPI.getById(id);
        const payload = res?.data ?? res;
        if (payload) setDisposal(payload);
        else {
          const adminResp = await adminAPI.getDisposalById(id);
          const payload2 = adminResp && adminResp.data ? adminResp.data : (adminResp?.data ?? adminResp);
          setDisposal(payload2);
        }
      } catch (e) {
        const adminResp = await adminAPI.getDisposalById(id);
        const payload = adminResp && adminResp.data ? adminResp.data : (adminResp?.data ?? adminResp);
        setDisposal(payload);
      }
    }catch(e){ console.error(e); alert('Failed to update status'); }
  }

  const remove = async ()=>{
    if(!confirm('Delete this disposal?')) return;
    try{
      try {
        await disposalsAPI.delete(id);
      } catch (e) {
        // try admin delete endpoint
        await api.delete(`/admin/disposals/${id}`);
      }
      // navigate back
      window.location.href = '/admin/disposals';
    }catch(e){ console.error(e); alert('Failed to delete'); }
  }

  if(loading) return <div className="p-8 text-center">Loading...</div>;
  if(error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if(!disposal) return <div className="p-8 text-center">No disposal found</div>;

  // derive display-friendly fields with fallbacks for different backend shapes
  const displayOrDash = (v) => {
    if (v === null || v === undefined || v === '') return '--';
    return v;
  };

  const genericName = displayOrDash(disposal.genericName || disposal.generic_name || disposal.medicine_name);
  const brandName = displayOrDash(disposal.brandName || disposal.brand_name || '');
  const riskLevel = displayOrDash(disposal.riskLevel || disposal.risk_level || 'N/A');
  const submittedAt = displayOrDash(disposal.createdAt || disposal.created_at || disposal.createdAt);

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Disposal #{displayOrDash(disposal.id)}</h1>
        <Link to="/admin/disposals" className="text-sm text-primary-blue">Back</Link>
      </div>

      <div className="mb-4">
        <button
          className="btn-outline text-sm"
          onClick={() => setShowRaw((s) => !s)}
        >
          {showRaw ? 'Hide raw' : 'Show raw payload'}
        </button>
        {showRaw && (
          <pre className="mt-2 p-3 bg-gray-50 rounded max-h-60 overflow-auto text-xs">
            {JSON.stringify(disposal, null, 2)}
          </pre>
        )}
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Medicine</h3>
              <p>{genericName} {brandName && brandName !== '--' ? `(${brandName})` : ''}</p>
          </div>
          <div>
            <h3 className="font-semibold">Risk Level</h3>
              <p>{riskLevel}</p>
          </div>
          <div>
            <h3 className="font-semibold">Status</h3>
              <p>{displayOrDash(disposal.status)}</p>
          </div>
          <div>
            <h3 className="font-semibold">Submitted</h3>
              <p>{submittedAt === '--' ? '--' : new Date(submittedAt).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="font-semibold">Disposed By</h3>
              <p>{displayOrDash(disposal.user?.name || disposal.disposedBy)}</p>
              <p className="text-sm text-gray-600">{displayOrDash(disposal.user?.email || '')}</p>
          </div>
          <div>
            <h3 className="font-semibold">Pickup</h3>
              {disposal.pickupRequest ? (
                <>
                  <p>Requested By: {displayOrDash(disposal.pickupRequest.requester?.name || disposal.requested_by || disposal.requester_name)}</p>
                  <p>CHW: {displayOrDash(disposal.pickupRequest.chw?.name || 'Not assigned')}</p>
                  <p>Status: {displayOrDash(disposal.pickupRequest.status)}</p>
                  <p>Picked Up By: {displayOrDash(disposal.pickupRequest.chw?.name || disposal.picked_by || disposal.pickedBy)}</p>
                  <p>Location: {displayOrDash(disposal.pickupRequest.pickupLocation || disposal.pickup_location)}</p>
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
