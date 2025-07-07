import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:5000';

const EditContract = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState(null);
  const [form, setForm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [signatures, setSignatures] = useState({ landlord: {}, tenant: {}, witness: {} });
  const [changed, setChanged] = useState({ landlord: false, tenant: false, witness: false });
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/contract/${contractId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setContractData(res.data);
        setForm({
          propertyAddress: res.data.propertyAddress,
          monthlyRent: res.data.monthlyRent,
          securityDeposit: res.data.securityDeposit,
          startDate: res.data.startDate?.slice(0, 10),
          endDate: res.data.endDate?.slice(0, 10),
          terms: res.data.terms,
          conditions: res.data.conditions,
          placeOfExecution: res.data.placeOfExecution,
          landlordDetails: { ...res.data.landlordDetails },
          tenantDetails: { ...res.data.tenantDetails },
          witnessName: res.data.witnessName,
          witnessAddress: res.data.witnessAddress
        });
        setSignatures(res.data.signatures || {});
      } catch (err) {
        alert('Failed to fetch contract.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [contractId, navigate]);

  const handleInputChange = (e, section) => {
    const { name, value } = e.target;
    setForm(prev => {
      if (section) {
        const changedFlag = { ...changed };
        if (contractData[section][name] !== value) changedFlag[section] = true;
        setChanged(changedFlag);
        return { ...prev, [section]: { ...prev[section], [name]: value } };
      }
      return { ...prev, [name]: value };
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.propertyAddress) errors.propertyAddress = 'Property address is required.';
    if (!form.tenantDetails.name) errors.tenantName = 'Tenant name is required.';
    if (!form.tenantDetails.email) errors.tenantEmail = 'Tenant email is required.';
    if (!form.tenantDetails.phone) errors.tenantPhone = 'Tenant phone is required.';
    if (!form.tenantDetails.address) errors.tenantAddress = 'Tenant address is required.';
    if (!form.landlordDetails.name) errors.landlordName = 'Landlord name is required.';
    if (!form.landlordDetails.email) errors.landlordEmail = 'Landlord email is required.';
    if (!form.landlordDetails.phone) errors.landlordPhone = 'Landlord phone is required.';
    if (!form.landlordDetails.address) errors.landlordAddress = 'Landlord address is required.';
    if (!form.startDate) errors.startDate = 'Start date is required.';
    if (!form.endDate) errors.endDate = 'End date is required.';
    if (!form.monthlyRent) errors.monthlyRent = 'Monthly rent is required.';
    if (!form.securityDeposit) errors.securityDeposit = 'Security deposit is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaveLoading(true);
    try {
      const payload = { ...form };
      const res = await axios.put(`${API_BASE}/api/contract/${contractId}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Contract updated successfully!');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update contract.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading || !form) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-4 text-green-900">Edit Contract</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold">Property Address</label>
            <input type="text" name="propertyAddress" value={form.propertyAddress} onChange={handleInputChange} className="w-full border rounded p-2" />
            {formErrors.propertyAddress && <div className="text-red-600 text-sm">{formErrors.propertyAddress}</div>}
          </div>
          <div>
            <label className="font-semibold">Place of Execution</label>
            <input type="text" name="placeOfExecution" value={form.placeOfExecution} onChange={handleInputChange} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="font-semibold">Start Date</label>
            <input type="date" name="startDate" value={form.startDate} onChange={handleInputChange} className="w-full border rounded p-2" />
            {formErrors.startDate && <div className="text-red-600 text-sm">{formErrors.startDate}</div>}
          </div>
          <div>
            <label className="font-semibold">End Date</label>
            <input type="date" name="endDate" value={form.endDate} onChange={handleInputChange} className="w-full border rounded p-2" />
            {formErrors.endDate && <div className="text-red-600 text-sm">{formErrors.endDate}</div>}
          </div>
          <div>
            <label className="font-semibold">Monthly Rent</label>
            <input type="number" name="monthlyRent" value={form.monthlyRent} onChange={handleInputChange} className="w-full border rounded p-2" />
            {formErrors.monthlyRent && <div className="text-red-600 text-sm">{formErrors.monthlyRent}</div>}
          </div>
          <div>
            <label className="font-semibold">Security Deposit</label>
            <input type="number" name="securityDeposit" value={form.securityDeposit} onChange={handleInputChange} className="w-full border rounded p-2" />
            {formErrors.securityDeposit && <div className="text-red-600 text-sm">{formErrors.securityDeposit}</div>}
          </div>
        </div>
        <div className="mt-4">
          <label className="font-semibold">Terms</label>
          <textarea name="terms" value={form.terms} onChange={handleInputChange} className="w-full border rounded p-2" rows={3} />
        </div>
        <div className="mt-4">
          <label className="font-semibold">Additional Conditions</label>
          <textarea name="conditions" value={form.conditions} onChange={handleInputChange} className="w-full border rounded p-2" rows={2} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="font-semibold">Landlord Name</label>
            <input type="text" name="name" value={form.landlordDetails.name} onChange={e => handleInputChange(e, 'landlordDetails')} className="w-full border rounded p-2" />
            <label className="font-semibold">Landlord Email</label>
            <input type="email" name="email" value={form.landlordDetails.email} onChange={e => handleInputChange(e, 'landlordDetails')} className="w-full border rounded p-2" />
            <label className="font-semibold">Landlord Phone</label>
            <input type="text" name="phone" value={form.landlordDetails.phone} onChange={e => handleInputChange(e, 'landlordDetails')} className="w-full border rounded p-2" />
            <label className="font-semibold">Landlord Address</label>
            <input type="text" name="address" value={form.landlordDetails.address} onChange={e => handleInputChange(e, 'landlordDetails')} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="font-semibold">Tenant Name</label>
            <input type="text" name="name" value={form.tenantDetails.name} onChange={e => handleInputChange(e, 'tenantDetails')} className="w-full border rounded p-2" />
            <label className="font-semibold">Tenant Email</label>
            <input type="email" name="email" value={form.tenantDetails.email} onChange={e => handleInputChange(e, 'tenantDetails')} className="w-full border rounded p-2" />
            <label className="font-semibold">Tenant Phone</label>
            <input type="text" name="phone" value={form.tenantDetails.phone} onChange={e => handleInputChange(e, 'tenantDetails')} className="w-full border rounded p-2" />
            <label className="font-semibold">Tenant Address</label>
            <input type="text" name="address" value={form.tenantDetails.address} onChange={e => handleInputChange(e, 'tenantDetails')} className="w-full border rounded p-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="font-semibold">Witness Name</label>
            <input type="text" name="witnessName" value={form.witnessName} onChange={handleInputChange} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="font-semibold">Witness Address</label>
            <input type="text" name="witnessAddress" value={form.witnessAddress} onChange={handleInputChange} className="w-full border rounded p-2" />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          {(changed.landlord || changed.tenant || changed.witness) && (
            <div className="text-yellow-700 font-semibold">Editing party details will require re-signing by that party.</div>
          )}
          <button type="submit" className="bg-green-700 text-white px-6 py-2 rounded font-bold hover:bg-green-800 transition-all" disabled={saveLoading}>{saveLoading ? 'Saving...' : 'Save Changes'}</button>
          <button type="button" className="bg-gray-200 text-gray-700 px-6 py-2 rounded font-bold hover:bg-gray-300 transition-all" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
      <div className="mt-8">
        <h3 className="font-semibold text-green-900 mb-2">Signature Status</h3>
        <div className="flex gap-8">
          <div>
            <div className="font-bold">Landlord</div>
            {signatures.landlord?.signed && signatures.landlord?.signatureImage ? (
              <img src={signatures.landlord.signatureImage} alt="Landlord Signature" className="border rounded h-16" />
            ) : <div className="text-gray-500">Not signed yet</div>}
          </div>
          <div>
            <div className="font-bold">Tenant</div>
            {signatures.tenant?.signed && signatures.tenant?.signatureImage ? (
              <img src={signatures.tenant.signatureImage} alt="Tenant Signature" className="border rounded h-16" />
            ) : <div className="text-gray-500">Not signed yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditContract; 