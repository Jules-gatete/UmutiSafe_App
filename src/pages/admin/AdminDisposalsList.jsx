import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../components/Table';
import StatCard from '../../components/StatCard';
import { adminAPI } from '../../services/api';

export default function AdminDisposalsList(){
  const [disposals, setDisposals] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayOrNote = (v, note = 'Not provided') => {
    if (v === null || v === undefined || v === '') return note;
    return v;
  };

  useEffect(()=>{
    const fetch = async ()=>{
      try {
        const [disposalsRes, pickupsRes] = await Promise.all([
          adminAPI.getDisposals(),
          // fetch pickups so we can show requested/picked info inline
          adminAPI.getPickups()
        ]);

        const disposalsData = (disposalsRes && disposalsRes.success) ? disposalsRes.data : (disposalsRes?.data ?? []);
        const pickupsData = (pickupsRes && pickupsRes.success) ? pickupsRes.data : (pickupsRes?.data ?? []);

        // build map from disposal id to pickup request
        const pickupMap = {};
        (pickupsData || []).forEach((p) => {
          // pickups in our backend are their own table and are linked from Disposal via Disposal.pickupRequestId
          // so map pickups by their id (and variants) rather than by disposal id
          if (p.id) pickupMap[String(p.id)] = p;
          if (p._id) pickupMap[String(p._id)] = p;
          if (p.pickupRequestId) pickupMap[String(p.pickupRequestId)] = p;
          if (p.pickup_request_id) pickupMap[String(p.pickup_request_id)] = p;
        });

        // attach pickupRequest to each disposal where available
        const enriched = (disposalsData || []).map((d) => ({
          ...d,
          // try matching by several possible disposal id fields (stringify keys)
          // Disposal holds pickupRequestId referencing PickupRequest.id
          pickupRequest: pickupMap[String(d.pickupRequestId)] ?? pickupMap[String(d.pickup_request_id)] ?? pickupMap[String(d.pickup_request)] ?? pickupMap[String(d.id)] ?? pickupMap[String(d._id)] ?? d.pickupRequest ?? d.pickup_request ?? null
        }));

        setDisposals(enriched);
      } catch(e){
        console.error('Failed to load admin disposals', e);
      } finally{ setLoading(false); }
    }
    fetch();
  },[])

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'genericName',
      label: 'Medicine',
      render: (value, row) => {
        const name = row.genericName || row.generic_name || row.medicine_name || null;
        const brand = row.brandName || row.brand_name || null;
        return (
          <div>
            <div className="font-medium">{displayOrNote(name, 'Unnamed medicine')}</div>
            {brand ? <div className="text-sm text-gray-600">{brand}</div> : null}
          </div>
        );
      }
    },
  { key: 'dosageForm', label: 'Form', render: (v) => displayOrNote(v, 'Unknown form') },
  { key: 'predictedCategory', label: 'Predicted Cat', render: (v) => displayOrNote(v, 'Not predicted') },
  { key: 'riskLevel', label: 'Risk', render: (v) => displayOrNote(v, 'Unknown risk') },
  { key: 'status', label: 'Status', render: (v) => displayOrNote(v ? String(v).replace('_', ' ').toUpperCase() : null, 'Status unknown') },
    {
      key: 'disposedBy',
      label: 'Disposed By',
      render: (v, row) => displayOrNote(row.user?.name || row.disposedBy || row.user_name, 'Unknown user')
    },
    // Requested By column removed per UI requirements - requester linked info shown in Pickup details
    {
      key: 'pickupBy',
  label: 'Pickup (Requested to / Collected by)',
      render: (v, row) => {
        // Show only the CHW assigned/collected for clarity. The "Disposed By" column
        // already shows the user who submitted the disposal request.
        const pr = row.pickupRequest || row.pickup_request || null;

        const chw = pr?.chw?.name
          || pr?.chw_name
          || pr?.pickedBy
          || pr?.picked_by
          || pr?.collected_by
          || pr?.collected_by_name
          || pr?.assigned_to?.name
          || pr?.requested_to?.name
          || pr?.requested_to
          || row.pickedBy
          || row.picked_by
          || null;

    // If there's a pickup request but no assigned chw, show a clear message.
    if (!chw && pr) return <div className="text-sm">Pickup requested (unassigned)</div>;
    if (!chw) return 'No pickup requested';

        // Optionally show status next to the CHW name if available
        const status = pr?.status || pr?.state || null;
        return (
          <div className="text-sm">
            <div>CHW: {displayOrNote(chw, 'Unassigned')}</div>
            {status && <div className="text-xs text-gray-600">{String(status).replace('_', ' ').toUpperCase()}</div>}
          </div>
        );
      }
    },
    { key: 'createdAt', label: 'Submitted', render: (v) => v ? new Date(v).toLocaleString() : 'Date unknown' },
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
