import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Async thunks
export const createOrderFromChat = createAsyncThunk(
  'orders/createOrderFromChat',
  async (orderData, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.post(`${API_URL}/orders/create-from-chat`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      const response = await axios.get(`${API_URL}/orders/my-orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
    }
  }
);

export const approveOrder = createAsyncThunk(
  'orders/approveOrder',
  async (orderId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`${API_URL}/orders/${orderId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve order');
    }
  }
);

export const rejectOrder = createAsyncThunk(
  'orders/rejectOrder',
  async ({ orderId, rejectionReason }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`${API_URL}/orders/${orderId}/reject`, {
        rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject order');
    }
  }
);

export const addSellerConditions = createAsyncThunk(
  'orders/addSellerConditions',
  async ({ orderId, conditions, sellerNotes }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`${API_URL}/orders/${orderId}/add-conditions`, {
        conditions,
        sellerNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add conditions');
    }
  }
);

export const markConditionMet = createAsyncThunk(
  'orders/markConditionMet',
  async ({ orderId, conditionIndex }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`${API_URL}/orders/${orderId}/mark-condition-met`, {
        conditionIndex
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark condition as met');
    }
  }
);

export const uploadOrderDocuments = createAsyncThunk(
  'orders/uploadOrderDocuments',
  async ({ orderId, documents }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const formData = new FormData();
      documents.forEach(document => {
        formData.append('documents', document);
      });
      
      const response = await axios.post(`${API_URL}/orders/${orderId}/upload-documents`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload documents');
    }
  }
);

export const updatePaymentDetails = createAsyncThunk(
  'orders/updatePaymentDetails',
  async ({ orderId, paymentDetails }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`${API_URL}/orders/${orderId}/update-payment`, {
        paymentDetails
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update payment details');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`${API_URL}/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  }
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Order from Chat
      .addCase(createOrderFromChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrderFromChat.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.unshift(action.payload.order);
        state.currentOrder = action.payload.order;
      })
      .addCase(createOrderFromChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.unshift(action.payload.order);
        state.currentOrder = action.payload.order;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch My Orders
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Approve Order
      .addCase(approveOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveOrder.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOrder = action.payload.order;
        
        // Update in orders array
        const orderIndex = state.orders.findIndex(o => o._id === updatedOrder._id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = updatedOrder;
        }
        
        // Update current order if it's the same
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
      })
      .addCase(approveOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Reject Order
      .addCase(rejectOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectOrder.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOrder = action.payload.order;
        
        // Update in orders array
        const orderIndex = state.orders.findIndex(o => o._id === updatedOrder._id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = updatedOrder;
        }
        
        // Update current order if it's the same
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
      })
      .addCase(rejectOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add Seller Conditions
      .addCase(addSellerConditions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSellerConditions.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOrder = action.payload.order;
        
        // Update in orders array
        const orderIndex = state.orders.findIndex(o => o._id === updatedOrder._id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = updatedOrder;
        }
        
        // Update current order if it's the same
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
      })
      .addCase(addSellerConditions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mark Condition Met
      .addCase(markConditionMet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markConditionMet.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOrder = action.payload.order;
        
        // Update in orders array
        const orderIndex = state.orders.findIndex(o => o._id === updatedOrder._id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = updatedOrder;
        }
        
        // Update current order if it's the same
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
      })
      .addCase(markConditionMet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Upload Order Documents
      .addCase(uploadOrderDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadOrderDocuments.fulfilled, (state, action) => {
        state.loading = false;
        const { orderId, documents } = action.payload;
        
        // Update order documents in all arrays
        const updateOrderDocuments = (order) => {
          if (order._id === orderId) {
            return { ...order, buyerDocuments: [...order.buyerDocuments, ...documents] };
          }
          return order;
        };
        
        state.orders = state.orders.map(updateOrderDocuments);
        
        if (state.currentOrder && state.currentOrder._id === orderId) {
          state.currentOrder = updateOrderDocuments(state.currentOrder);
        }
      })
      .addCase(uploadOrderDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Payment Details
      .addCase(updatePaymentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePaymentDetails.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOrder = action.payload.order;
        
        // Update in orders array
        const orderIndex = state.orders.findIndex(o => o._id === updatedOrder._id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = updatedOrder;
        }
        
        // Update current order if it's the same
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
      })
      .addCase(updatePaymentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOrder = action.payload.order;
        
        // Update in orders array
        const orderIndex = state.orders.findIndex(o => o._id === updatedOrder._id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = updatedOrder;
        }
        
        // Update current order if it's the same
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentOrder, setCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer; 