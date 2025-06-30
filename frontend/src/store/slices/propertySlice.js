import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Async thunks
export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      const response = await axios.get(`${API_URL}/properties?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch properties');
    }
  }
);

export const fetchPropertyById = createAsyncThunk(
  'properties/fetchPropertyById',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/properties/${propertyId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch property');
    }
  }
);

export const createProperty = createAsyncThunk(
  'properties/createProperty',
  async (propertyData, { rejectWithValue, getState }) => {
    // DEMO MODE: Simulate property creation without API call
    // Extract form data if FormData is used
    let newProperty = {};
    if (propertyData instanceof FormData) {
      propertyData.forEach((value, key) => {
        if (key.startsWith('location[')) {
          const locKey = key.replace('location[', '').replace(']', '');
          newProperty.location = newProperty.location || {};
          newProperty.location[locKey] = value;
        } else if (key === 'amenities') {
          try { newProperty.amenities = JSON.parse(value); } catch { newProperty.amenities = []; }
        } else if (key === 'images') {
          newProperty.images = newProperty.images || [];
          newProperty.images.push(typeof value === 'string' ? value : URL.createObjectURL(value));
        } else {
          newProperty[key] = value;
        }
      });
    } else {
      newProperty = { ...propertyData };
    }
    // Assign a random id and sellerId for demo
    newProperty.id = 'demo_' + Math.random().toString(36).substr(2, 9);
    newProperty.sellerId = 'u2';
    newProperty.verified = false;
    newProperty.status = 'available';
    return { property: newProperty };
  }
);

export const updateProperty = createAsyncThunk(
  'properties/updateProperty',
  async ({ propertyId, propertyData }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`${API_URL}/properties/${propertyId}`, propertyData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update property');
    }
  }
);

export const deleteProperty = createAsyncThunk(
  'properties/deleteProperty',
  async (propertyId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      await axios.delete(`${API_URL}/properties/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return propertyId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete property');
    }
  }
);

export const uploadPropertyImages = createAsyncThunk(
  'properties/uploadPropertyImages',
  async ({ propertyId, images }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const formData = new FormData();
      images.forEach(image => {
        formData.append('images', image);
      });
      
      const response = await axios.post(`${API_URL}/properties/${propertyId}/upload-images`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return { propertyId, images: response.data.images };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload images');
    }
  }
);

export const uploadPropertyDocuments = createAsyncThunk(
  'properties/uploadPropertyDocuments',
  async ({ propertyId, documents, documentType }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const formData = new FormData();
      documents.forEach(document => {
        formData.append('documents', document);
      });
      formData.append('documentType', documentType);
      
      const response = await axios.post(`${API_URL}/properties/${propertyId}/upload-documents`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return { propertyId, documents: response.data.documents };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload documents');
    }
  }
);

export const fetchMyProperties = createAsyncThunk(
  'properties/fetchMyProperties',
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      const response = await axios.get(`${API_URL}/properties/seller/my-properties?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my properties');
    }
  }
);

const initialState = {
  properties: [],
  currentProperty: null,
  myProperties: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  filters: {
    type: '',
    purpose: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    verified: '',
    search: ''
  }
};

const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProperty: (state) => {
      state.currentProperty = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentProperty: (state, action) => {
      state.currentProperty = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Properties
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload.properties;
        state.pagination.totalPages = action.payload.totalPages;
        state.pagination.totalItems = action.payload.totalItems;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Property by ID
      .addCase(fetchPropertyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProperty = action.payload;
      })
      .addCase(fetchPropertyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Property (DEMO)
      .addCase(createProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.properties.unshift(action.payload.property);
        state.myProperties.unshift(action.payload.property);
      })
      .addCase(createProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Property
      .addCase(updateProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProperty = action.payload.property;
        
        // Update in properties array
        const propertyIndex = state.properties.findIndex(p => p._id === updatedProperty._id);
        if (propertyIndex !== -1) {
          state.properties[propertyIndex] = updatedProperty;
        }
        
        // Update in myProperties array
        const myPropertyIndex = state.myProperties.findIndex(p => p._id === updatedProperty._id);
        if (myPropertyIndex !== -1) {
          state.myProperties[myPropertyIndex] = updatedProperty;
        }
        
        // Update current property if it's the same
        if (state.currentProperty && state.currentProperty._id === updatedProperty._id) {
          state.currentProperty = updatedProperty;
        }
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Property
      .addCase(deleteProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        
        // Remove from properties array
        state.properties = state.properties.filter(p => p._id !== deletedId);
        
        // Remove from myProperties array
        state.myProperties = state.myProperties.filter(p => p._id !== deletedId);
        
        // Clear current property if it's the deleted one
        if (state.currentProperty && state.currentProperty._id === deletedId) {
          state.currentProperty = null;
        }
      })
      .addCase(deleteProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Upload Property Images
      .addCase(uploadPropertyImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadPropertyImages.fulfilled, (state, action) => {
        state.loading = false;
        const { propertyId, images } = action.payload;
        
        // Update property images in all arrays
        const updatePropertyImages = (property) => {
          if (property._id === propertyId) {
            return { ...property, images: [...property.images, ...images] };
          }
          return property;
        };
        
        state.properties = state.properties.map(updatePropertyImages);
        state.myProperties = state.myProperties.map(updatePropertyImages);
        
        if (state.currentProperty && state.currentProperty._id === propertyId) {
          state.currentProperty = updatePropertyImages(state.currentProperty);
        }
      })
      .addCase(uploadPropertyImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch My Properties
      .addCase(fetchMyProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.myProperties = action.payload.properties;
      })
      .addCase(fetchMyProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentProperty, setFilters, clearFilters, setCurrentProperty } = propertySlice.actions;
export default propertySlice.reducer; 