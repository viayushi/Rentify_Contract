import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Async thunks
export const fetchAgreements = createAsyncThunk(
  'agreements/fetchAgreements',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      const response = await axios.get(`${API_URL}/agreements?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch agreements');
    }
  }
);

export const fetchAgreementById = createAsyncThunk(
  'agreements/fetchAgreementById',
  async (agreementId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/agreements/${agreementId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch agreement');
    }
  }
);

export const createAgreement = createAsyncThunk(
  'agreements/createAgreement',
  async (agreementData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/agreements`, agreementData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create agreement');
    }
  }
);

export const updateAgreement = createAsyncThunk(
  'agreements/updateAgreement',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/agreements/${id}`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update agreement');
    }
  }
);

export const signAgreement = createAsyncThunk(
  'agreements/signAgreement',
  async ({ agreementId, signatureData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/agreements/${agreementId}/sign`, signatureData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sign agreement');
    }
  }
);

export const downloadAgreement = createAsyncThunk(
  'agreements/downloadAgreement',
  async (agreementId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/agreements/${agreementId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to download agreement');
    }
  }
);

const initialState = {
  agreements: [],
  selectedAgreement: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  filters: {
    status: '',
    propertyId: '',
    tenantId: '',
    landlordId: '',
    startDate: '',
    endDate: ''
  }
};

const agreementSlice = createSlice({
  name: 'agreements',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedAgreement: (state) => {
      state.selectedAgreement = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSelectedAgreement: (state, action) => {
      state.selectedAgreement = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Agreements
      .addCase(fetchAgreements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgreements.fulfilled, (state, action) => {
        state.loading = false;
        state.agreements = action.payload.agreements;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAgreements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Agreement by ID
      .addCase(fetchAgreementById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgreementById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAgreement = action.payload.agreement;
      })
      .addCase(fetchAgreementById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Agreement
      .addCase(createAgreement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAgreement.fulfilled, (state, action) => {
        state.loading = false;
        const newAgreement = action.payload.agreement;
        state.agreements.unshift(newAgreement);
        state.selectedAgreement = newAgreement;
      })
      .addCase(createAgreement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Agreement
      .addCase(updateAgreement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAgreement.fulfilled, (state, action) => {
        state.loading = false;
        const updatedAgreement = action.payload.agreement;
        
        // Update in agreements array
        const agreementIndex = state.agreements.findIndex(a => a._id === updatedAgreement._id);
        if (agreementIndex !== -1) {
          state.agreements[agreementIndex] = updatedAgreement;
        }
        
        // Update selected agreement if it's the same
        if (state.selectedAgreement && state.selectedAgreement._id === updatedAgreement._id) {
          state.selectedAgreement = updatedAgreement;
        }
      })
      .addCase(updateAgreement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Sign Agreement
      .addCase(signAgreement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signAgreement.fulfilled, (state, action) => {
        state.loading = false;
        const signedAgreement = action.payload.agreement;
        
        // Update in agreements array
        const agreementIndex = state.agreements.findIndex(a => a._id === signedAgreement._id);
        if (agreementIndex !== -1) {
          state.agreements[agreementIndex] = signedAgreement;
        }
        
        // Update selected agreement if it's the same
        if (state.selectedAgreement && state.selectedAgreement._id === signedAgreement._id) {
          state.selectedAgreement = signedAgreement;
        }
      })
      .addCase(signAgreement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Download Agreement
      .addCase(downloadAgreement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadAgreement.fulfilled, (state, action) => {
        state.loading = false;
        // Handle file download
        const blob = new Blob([action.payload], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'rental-agreement.pdf';
        link.click();
        window.URL.revokeObjectURL(url);
      })
      .addCase(downloadAgreement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  clearSelectedAgreement, 
  setFilters, 
  clearFilters, 
  setSelectedAgreement 
} = agreementSlice.actions;

export default agreementSlice.reducer; 