import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAgreements } from '../store/slices/agreementSlice';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const AgreementsPage = () => {
  const dispatch = useDispatch();
  const { agreements, loading, error } = useSelector((state) => state.agreement);

  const [filter, setFilter] = useState('all'); // all, pending, signed, expired

  useEffect(() => {
    dispatch(fetchAgreements());
  }, [dispatch]);

  const filteredAgreements = agreements.filter(agreement => {
    return filter === 'all' || agreement.status === filter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Signature' },
      signed: { color: 'bg-green-100 text-green-800', text: 'Signed' },
      expired: { color: 'bg-red-100 text-red-800', text: 'Expired' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rental Agreements</h1>
          <p className="text-gray-600">Manage your rental agreements and contracts</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4">
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
              Filter by Status
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Agreements</option>
              <option value="pending">Pending Signature</option>
              <option value="signed">Signed</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Agreements List */}
        {filteredAgreements.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {filter !== 'all' ? 'No agreements found' : 'No agreements yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter !== 'all' 
                ? 'Try adjusting your filter criteria.'
                : 'Agreements will appear here once created.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAgreements.map((agreement) => (
              <div key={agreement._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-indigo-100 rounded-lg overflow-hidden">
                        {agreement.property.images && agreement.property.images[0] ? (
                          <img
                            src={agreement.property.images[0]}
                            alt={agreement.property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-400">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {agreement.property.title}
                        </h3>
                        <p className="text-gray-600">{agreement.property.location}</p>
                        <p className="text-sm text-gray-500">Agreement #{agreement._id.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(agreement.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{formatDate(agreement.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">End Date</p>
                      <p className="font-medium">{formatDate(agreement.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monthly Rent</p>
                      <p className="font-medium text-indigo-600">${agreement.monthlyRent}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <Link
                        to={`/properties/${agreement.property._id}`}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        View Property
                      </Link>
                      <Link
                        to={`/agreements/${agreement._id}`}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        View Agreement
                      </Link>
                      {agreement.status === 'pending' && (
                        <Link
                          to={`/agreements/${agreement._id}/sign`}
                          className="text-green-600 hover:text-green-500 text-sm font-medium"
                        >
                          Sign Agreement
                        </Link>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Created on {formatDate(agreement.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {agreements.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Agreement Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{agreements.length}</div>
                <div className="text-gray-500">Total Agreements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {agreements.filter(a => a.status === 'pending').length}
                </div>
                <div className="text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {agreements.filter(a => a.status === 'signed').length}
                </div>
                <div className="text-gray-500">Signed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {agreements.filter(a => a.status === 'expired').length}
                </div>
                <div className="text-gray-500">Expired</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgreementsPage; 